use bollard::models::Network;
use bollard::network::{CreateNetworkOptions, ListNetworksOptions, PruneNetworksOptions};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::docker::images::PruneResult;
use crate::docker::DockerManager;
use crate::error::PortoResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConnectedContainer {
    pub container_id: String,
    pub name: String,
    pub ipv4_address: String,
    pub ipv6_address: String,
    pub mac_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortoNetworkInfo {
    pub id: String,
    pub short_id: String,
    pub name: String,
    pub driver: String,
    pub scope: String,
    pub internal: bool,
    pub attachable: bool,
    pub ingress: bool,
    pub subnet: Option<String>,
    pub gateway: Option<String>,
    pub containers: Vec<NetworkConnectedContainer>,
    pub labels: HashMap<String, String>,
}

pub async fn list_networks(manager: &DockerManager) -> PortoResult<Vec<PortoNetworkInfo>> {
    let client = manager.get_client().await;
    let networks = client
        .list_networks(None::<ListNetworksOptions<String>>)
        .await?;

    let mut result = Vec::with_capacity(networks.len());

    for net in networks {
        let id = net.id.unwrap_or_default();
        let short_id = if id.len() > 12 { id[..12].to_string() } else { id.clone() };
        let name = net.name.unwrap_or_default();
        let driver = net.driver.unwrap_or_else(|| "bridge".to_string());
        let scope = net.scope.unwrap_or_else(|| "local".to_string());
        let internal = net.internal.unwrap_or(false);
        let attachable = net.attachable.unwrap_or(false);
        let ingress = net.ingress.unwrap_or(false);

        let mut subnet = None;
        let mut gateway = None;

        if let Some(ipam) = net.ipam {
            if let Some(configs) = ipam.config {
                if let Some(first) = configs.first() {
                    subnet = first.subnet.clone();
                    gateway = first.gateway.clone();
                }
            }
        }

        let mut containers = Vec::new();
        if let Some(net_containers) = net.containers {
            for (c_id, endpoint) in net_containers {
                containers.push(NetworkConnectedContainer {
                    container_id: c_id,
                    name: endpoint.name.unwrap_or_default(),
                    ipv4_address: endpoint.ipv4_address.unwrap_or_default(),
                    ipv6_address: endpoint.ipv6_address.unwrap_or_default(),
                    mac_address: endpoint.mac_address.unwrap_or_default(),
                });
            }
        }

        result.push(PortoNetworkInfo {
            id,
            short_id,
            name,
            driver,
            scope,
            internal,
            attachable,
            ingress,
            subnet,
            gateway,
            containers,
            labels: net.labels.unwrap_or_default(),
        });
    }

    Ok(result)
}

pub async fn inspect_network(manager: &DockerManager, id_or_name: &str) -> PortoResult<Network> {
    let client = manager.get_client().await;
    let inspect = client.inspect_network::<String>(id_or_name, None).await?;
    Ok(inspect)
}

pub async fn create_network(
    manager: &DockerManager,
    name: &str,
    driver: Option<&str>,
    internal: bool,
    attachable: bool,
) -> PortoResult<String> {
    let client = manager.get_client().await;
    let options = CreateNetworkOptions {
        name: name.to_string(),
        driver: driver.unwrap_or("bridge").to_string(),
        internal,
        attachable,
        ..Default::default()
    };

    let res = client.create_network(options).await?;
    Ok(res.id)
}

pub async fn remove_network(manager: &DockerManager, id_or_name: &str) -> PortoResult<()> {
    let client = manager.get_client().await;
    client.remove_network(id_or_name).await?;
    Ok(())
}

pub async fn prune_networks(manager: &DockerManager) -> PortoResult<PruneResult> {
    let client = manager.get_client().await;
    let report = client
        .prune_networks(None::<PruneNetworksOptions<String>>)
        .await?;

    let deleted = report.networks_deleted.unwrap_or_default();

    Ok(PruneResult {
        space_reclaimed_bytes: 0,
        deleted_items: deleted,
    })
}
