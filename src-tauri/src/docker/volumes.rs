use bollard::models::Volume;
use bollard::volume::{CreateVolumeOptions, ListVolumesOptions, PruneVolumesOptions, RemoveVolumeOptions};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::docker::images::PruneResult;
use crate::docker::DockerManager;
use crate::error::PortoResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortoVolumeInfo {
    pub name: String,
    pub driver: String,
    pub scope: String,
    pub mountpoint: String,
    pub created_at: Option<String>,
    pub labels: HashMap<String, String>,
    pub options: HashMap<String, String>,
    pub in_use: bool,
    pub size_estimate_bytes: Option<u64>,
}

pub async fn list_volumes(manager: &DockerManager) -> PortoResult<Vec<PortoVolumeInfo>> {
    let client = manager.get_client().await;
    let response = client
        .list_volumes(None::<ListVolumesOptions<String>>)
        .await?;

    let volumes = response.volumes.unwrap_or_default();
    let mut result = Vec::with_capacity(volumes.len());

    for vol in volumes {
        let name = vol.name;
        let driver = vol.driver;
        let scope = vol.scope.map(|s| format!("{:?}", s)).unwrap_or_else(|| "local".to_string());
        let mountpoint = vol.mountpoint;
        let created_at = vol.created_at;
        let labels = vol.labels;
        let size_estimate = vol.usage_data.map(|u| u.size as u64);

        result.push(PortoVolumeInfo {
            name,
            driver,
            scope,
            mountpoint,
            created_at,
            labels,
            options: vol.options,
            in_use: false, // will be mapped by caller or inspect
            size_estimate_bytes: size_estimate,
        });
    }

    Ok(result)
}

pub async fn create_volume(
    manager: &DockerManager,
    name: &str,
    driver: Option<&str>,
    labels: Option<HashMap<String, String>>,
) -> PortoResult<PortoVolumeInfo> {
    let client = manager.get_client().await;
    let options = CreateVolumeOptions {
        name: name.to_string(),
        driver: driver.unwrap_or("local").to_string(),
        driver_opts: HashMap::new(),
        labels: labels.unwrap_or_default(),
    };

    let vol = client.create_volume(options).await?;

    Ok(PortoVolumeInfo {
        name: vol.name,
        driver: vol.driver,
        scope: vol.scope.map(|s| format!("{:?}", s)).unwrap_or_else(|| "local".to_string()),
        mountpoint: vol.mountpoint,
        created_at: vol.created_at,
        labels: vol.labels,
        options: vol.options,
        in_use: false,
        size_estimate_bytes: None,
    })
}

pub async fn inspect_volume(manager: &DockerManager, name: &str) -> PortoResult<Volume> {
    let client = manager.get_client().await;
    let inspect = client.inspect_volume(name).await?;
    Ok(inspect)
}

pub async fn remove_volume(manager: &DockerManager, name: &str, force: bool) -> PortoResult<()> {
    let client = manager.get_client().await;
    client
        .remove_volume(
            name,
            Some(RemoveVolumeOptions {
                force,
            }),
        )
        .await?;
    Ok(())
}

pub async fn prune_volumes(manager: &DockerManager) -> PortoResult<PruneResult> {
    let client = manager.get_client().await;
    let report = client
        .prune_volumes(None::<PruneVolumesOptions<String>>)
        .await?;

    let space = report.space_reclaimed.unwrap_or(0) as u64;
    let deleted = report.volumes_deleted.unwrap_or_default();

    Ok(PruneResult {
        space_reclaimed_bytes: space,
        deleted_items: deleted,
    })
}
