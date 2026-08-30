use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::docker::containers::{list_containers, PortoContainerInfo};
use crate::docker::DockerManager;
use crate::error::PortoResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposeServiceInfo {
    pub service_name: String,
    pub project_name: String,
    pub container_ids: Vec<String>,
    pub container_names: Vec<String>,
    pub running_count: usize,
    pub total_count: usize,
    pub image: String,
    pub state: String,
    pub ports: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposeProjectInfo {
    pub project_name: String,
    pub working_dir: Option<String>,
    pub config_files: Option<String>,
    pub services: Vec<ComposeServiceInfo>,
    pub total_containers: usize,
    pub running_containers: usize,
    pub status: String,
}

pub async fn list_compose_projects(manager: &DockerManager) -> PortoResult<Vec<ComposeProjectInfo>> {
    let containers = list_containers(manager, true).await?;

    let mut project_map: HashMap<String, HashMap<String, Vec<PortoContainerInfo>>> = HashMap::new();
    let mut project_metadata: HashMap<String, (Option<String>, Option<String>)> = HashMap::new();

    for c in containers {
        let project = c.compose_project.clone().unwrap_or_else(|| "standalone".to_string());
        let service = c.compose_service.clone().unwrap_or_else(|| c.display_name.clone());

        let workdir = c.labels.get("com.docker.compose.project.working_dir").cloned();
        let config_files = c.labels.get("com.docker.compose.project.config_files").cloned();

        project_metadata.entry(project.clone()).or_insert((workdir, config_files));

        project_map
            .entry(project)
            .or_default()
            .entry(service)
            .or_default()
            .push(c);
    }

    let mut projects = Vec::new();

    for (proj_name, services_map) in project_map {
        let (working_dir, config_files) = project_metadata
            .get(&proj_name)
            .cloned()
            .unwrap_or((None, None));

        let mut services = Vec::new();
        let mut total_c = 0;
        let mut running_c = 0;

        for (svc_name, svc_containers) in services_map {
            let total = svc_containers.len();
            let running = svc_containers
                .iter()
                .filter(|c| c.state.to_lowercase() == "running")
                .count();

            total_c += total;
            running_c += running;

            let first = svc_containers.first();
            let image = first.map(|c| c.image.clone()).unwrap_or_default();
            let state = if running == total && total > 0 {
                "running".to_string()
            } else if running > 0 {
                "partial".to_string()
            } else {
                "stopped".to_string()
            };

            let mut ports_list = Vec::new();
            for c in &svc_containers {
                for p in &c.ports {
                    if let Some(pub_p) = p.public_port {
                        ports_list.push(format!("{}:{}", pub_p, p.private_port));
                    }
                }
            }

            services.push(ComposeServiceInfo {
                service_name: svc_name,
                project_name: proj_name.clone(),
                container_ids: svc_containers.iter().map(|c| c.id.clone()).collect(),
                container_names: svc_containers.iter().map(|c| c.display_name.clone()).collect(),
                running_count: running,
                total_count: total,
                image,
                state,
                ports: ports_list,
            });
        }

        let proj_status = if running_c == total_c && total_c > 0 {
            "running".to_string()
        } else if running_c > 0 {
            "partial".to_string()
        } else {
            "stopped".to_string()
        };

        projects.push(ComposeProjectInfo {
            project_name: proj_name,
            working_dir,
            config_files,
            services,
            total_containers: total_c,
            running_containers: running_c,
            status: proj_status,
        });
    }

    projects.sort_by(|a, b| a.project_name.cmp(&b.project_name));
    Ok(projects)
}
