use bollard::image::{CreateImageOptions, ListImagesOptions, PruneImagesOptions, RemoveImageOptions};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::docker::DockerManager;
use crate::error::{PortoError, PortoResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortoImageInfo {
    pub id: String,
    pub short_id: String,
    pub repo_tags: Vec<String>,
    pub repository: String,
    pub tag: String,
    pub size_bytes: i64,
    pub created: i64,
    pub in_use: bool,
    pub containers_count: i64,
    pub labels: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PruneResult {
    pub space_reclaimed_bytes: u64,
    pub deleted_items: Vec<String>,
}

pub async fn list_images(manager: &DockerManager) -> PortoResult<Vec<PortoImageInfo>> {
    let client = manager.get_client().await;
    let images = client
        .list_images(Some(ListImagesOptions::<String> {
            all: true,
            ..Default::default()
        }))
        .await?;

    let mut result = Vec::with_capacity(images.len());
    for img in images {
        let full_id = img.id;
        let short_id = if full_id.starts_with("sha256:") && full_id.len() > 19 {
            full_id[7..19].to_string()
        } else if full_id.len() > 12 {
            full_id[..12].to_string()
        } else {
            full_id.clone()
        };

        let repo_tags = img.repo_tags;
        let (repository, tag) = if let Some(first_tag) = repo_tags.first() {
            if first_tag == "<none>:<none>" {
                ("<none>".to_string(), "<none>".to_string())
            } else {
                let parts: Vec<&str> = first_tag.rsplitn(2, ':').collect();
                if parts.len() == 2 {
                    (parts[1].to_string(), parts[0].to_string())
                } else {
                    (first_tag.clone(), "latest".to_string())
                }
            }
        } else {
            ("<none>".to_string(), "<none>".to_string())
        };

        let containers_count = img.containers;
        let in_use = containers_count > 0;

        result.push(PortoImageInfo {
            id: full_id,
            short_id,
            repo_tags,
            repository,
            tag,
            size_bytes: img.size,
            created: img.created,
            in_use,
            containers_count,
            labels: img.labels,
        });
    }

    Ok(result)
}

pub async fn inspect_image(
    manager: &DockerManager,
    name_or_id: &str,
) -> PortoResult<bollard::models::ImageInspect> {
    let client = manager.get_client().await;
    let inspect = client.inspect_image(name_or_id).await?;
    Ok(inspect)
}

pub async fn pull_image(
    manager: &DockerManager,
    from_image: &str,
    tag: Option<&str>,
) -> PortoResult<String> {
    let client = manager.get_client().await;
    let t = tag.unwrap_or("latest");
    let options = CreateImageOptions {
        from_image: from_image.to_string(),
        tag: t.to_string(),
        ..Default::default()
    };

    let mut stream = client.create_image(Some(options), None, None);
    let mut last_status = String::new();

    while let Some(msg_result) = stream.next().await {
        match msg_result {
            Ok(info) => {
                if let Some(status) = info.status {
                    last_status = status;
                }
            }
            Err(e) => return Err(PortoError::Docker(e)),
        }
    }

    Ok(last_status)
}

pub async fn remove_image(
    manager: &DockerManager,
    name_or_id: &str,
    force: bool,
) -> PortoResult<()> {
    let client = manager.get_client().await;
    client
        .remove_image(
            name_or_id,
            Some(RemoveImageOptions {
                force,
                noprune: false,
            }),
            None,
        )
        .await?;
    Ok(())
}

pub async fn prune_images(manager: &DockerManager, all_unused: bool) -> PortoResult<PruneResult> {
    let client = manager.get_client().await;
    let mut filters = HashMap::new();
    if all_unused {
        filters.insert("dangling".to_string(), vec!["false".to_string()]);
    } else {
        filters.insert("dangling".to_string(), vec!["true".to_string()]);
    }

    let report = client
        .prune_images(Some(PruneImagesOptions { filters }))
        .await?;

    let space = report.space_reclaimed.unwrap_or(0) as u64;
    let deleted = report
        .images_deleted
        .unwrap_or_default()
        .into_iter()
        .filter_map(|d| d.deleted.or(d.untagged))
        .collect();

    Ok(PruneResult {
        space_reclaimed_bytes: space,
        deleted_items: deleted,
    })
}
