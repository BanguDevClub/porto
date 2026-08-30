pub mod docker;
pub mod error;
pub mod host;

use docker::compose::{list_compose_projects, ComposeProjectInfo};
use docker::containers::{
    exec_container_command, get_container_logs, get_container_stats, inspect_container,
    list_containers, pause_container, remove_container, restart_container, start_container,
    stop_container, unpause_container, ContainerExecResult, ContainerResourceStats,
    PortoContainerInfo,
};
use docker::images::{
    inspect_image, list_images, prune_images, pull_image, remove_image, PortoImageInfo,
    PruneResult,
};
use docker::networks::{
    create_network, inspect_network, list_networks, prune_networks, remove_network,
    PortoNetworkInfo,
};
use docker::volumes::{
    create_volume, inspect_volume, list_volumes, prune_volumes, remove_volume, PortoVolumeInfo,
};
use docker::{DockerManager, DockerSystemOverview};
use error::PortoResult;
use host::sysinfo::{HostMetricsManager, HostSystemTelemetry};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub docker: Arc<DockerManager>,
    pub host_metrics: Arc<HostMetricsManager>,
}

#[tauri::command]
async fn get_docker_overview(state: State<'_, AppState>) -> PortoResult<DockerSystemOverview> {
    state.docker.get_system_overview().await
}

#[tauri::command]
async fn set_docker_socket(state: State<'_, AppState>, socket_path: String) -> PortoResult<()> {
    state.docker.set_socket(&socket_path).await
}

#[tauri::command]
async fn cmd_list_containers(
    state: State<'_, AppState>,
    all: bool,
) -> PortoResult<Vec<PortoContainerInfo>> {
    list_containers(&state.docker, all).await
}

#[tauri::command]
async fn cmd_inspect_container(
    state: State<'_, AppState>,
    id: String,
) -> PortoResult<bollard::models::ContainerInspectResponse> {
    inspect_container(&state.docker, &id).await
}

#[tauri::command]
async fn cmd_get_container_stats(
    state: State<'_, AppState>,
    id: String,
) -> PortoResult<ContainerResourceStats> {
    get_container_stats(&state.docker, &id).await
}

#[tauri::command]
async fn cmd_start_container(state: State<'_, AppState>, id: String) -> PortoResult<()> {
    start_container(&state.docker, &id).await
}

#[tauri::command]
async fn cmd_stop_container(
    state: State<'_, AppState>,
    id: String,
    timeout_secs: Option<i64>,
) -> PortoResult<()> {
    stop_container(&state.docker, &id, timeout_secs).await
}

#[tauri::command]
async fn cmd_restart_container(
    state: State<'_, AppState>,
    id: String,
    timeout_secs: Option<isize>,
) -> PortoResult<()> {
    restart_container(&state.docker, &id, timeout_secs).await
}

#[tauri::command]
async fn cmd_pause_container(state: State<'_, AppState>, id: String) -> PortoResult<()> {
    pause_container(&state.docker, &id).await
}

#[tauri::command]
async fn cmd_unpause_container(state: State<'_, AppState>, id: String) -> PortoResult<()> {
    unpause_container(&state.docker, &id).await
}

#[tauri::command]
async fn cmd_remove_container(
    state: State<'_, AppState>,
    id: String,
    force: bool,
    remove_volumes: bool,
) -> PortoResult<()> {
    remove_container(&state.docker, &id, force, remove_volumes).await
}

#[tauri::command]
async fn cmd_get_container_logs(
    state: State<'_, AppState>,
    id: String,
    tail: Option<String>,
    timestamps: bool,
) -> PortoResult<String> {
    get_container_logs(&state.docker, &id, tail, timestamps).await
}

#[tauri::command]
async fn cmd_exec_container_command(
    state: State<'_, AppState>,
    id: String,
    cmd: Vec<String>,
) -> PortoResult<ContainerExecResult> {
    exec_container_command(&state.docker, &id, cmd).await
}

#[tauri::command]
async fn cmd_list_images(state: State<'_, AppState>) -> PortoResult<Vec<PortoImageInfo>> {
    list_images(&state.docker).await
}

#[tauri::command]
async fn cmd_inspect_image(
    state: State<'_, AppState>,
    name_or_id: String,
) -> PortoResult<bollard::models::ImageInspect> {
    inspect_image(&state.docker, &name_or_id).await
}

#[tauri::command]
async fn cmd_pull_image(
    state: State<'_, AppState>,
    from_image: String,
    tag: Option<String>,
) -> PortoResult<String> {
    pull_image(&state.docker, &from_image, tag.as_deref()).await
}

#[tauri::command]
async fn cmd_remove_image(
    state: State<'_, AppState>,
    name_or_id: String,
    force: bool,
) -> PortoResult<()> {
    remove_image(&state.docker, &name_or_id, force).await
}

#[tauri::command]
async fn cmd_prune_images(
    state: State<'_, AppState>,
    all_unused: bool,
) -> PortoResult<PruneResult> {
    prune_images(&state.docker, all_unused).await
}

#[tauri::command]
async fn cmd_list_volumes(state: State<'_, AppState>) -> PortoResult<Vec<PortoVolumeInfo>> {
    list_volumes(&state.docker).await
}

#[tauri::command]
async fn cmd_create_volume(
    state: State<'_, AppState>,
    name: String,
    driver: Option<String>,
    labels: Option<HashMap<String, String>>,
) -> PortoResult<PortoVolumeInfo> {
    create_volume(&state.docker, &name, driver.as_deref(), labels).await
}

#[tauri::command]
async fn cmd_inspect_volume(
    state: State<'_, AppState>,
    name: String,
) -> PortoResult<bollard::models::Volume> {
    inspect_volume(&state.docker, &name).await
}

#[tauri::command]
async fn cmd_remove_volume(
    state: State<'_, AppState>,
    name: String,
    force: bool,
) -> PortoResult<()> {
    remove_volume(&state.docker, &name, force).await
}

#[tauri::command]
async fn cmd_prune_volumes(state: State<'_, AppState>) -> PortoResult<PruneResult> {
    prune_volumes(&state.docker).await
}

#[tauri::command]
async fn cmd_list_networks(state: State<'_, AppState>) -> PortoResult<Vec<PortoNetworkInfo>> {
    list_networks(&state.docker).await
}

#[tauri::command]
async fn cmd_inspect_network(
    state: State<'_, AppState>,
    id_or_name: String,
) -> PortoResult<bollard::models::Network> {
    inspect_network(&state.docker, &id_or_name).await
}

#[tauri::command]
async fn cmd_create_network(
    state: State<'_, AppState>,
    name: String,
    driver: Option<String>,
    internal: bool,
    attachable: bool,
) -> PortoResult<String> {
    create_network(&state.docker, &name, driver.as_deref(), internal, attachable).await
}

#[tauri::command]
async fn cmd_remove_network(state: State<'_, AppState>, id_or_name: String) -> PortoResult<()> {
    remove_network(&state.docker, &id_or_name).await
}

#[tauri::command]
async fn cmd_prune_networks(state: State<'_, AppState>) -> PortoResult<PruneResult> {
    prune_networks(&state.docker).await
}

#[tauri::command]
async fn cmd_list_compose_projects(
    state: State<'_, AppState>,
) -> PortoResult<Vec<ComposeProjectInfo>> {
    list_compose_projects(&state.docker).await
}

#[tauri::command]
async fn cmd_get_host_telemetry(state: State<'_, AppState>) -> PortoResult<HostSystemTelemetry> {
    Ok(state.host_metrics.sample_telemetry().await)
}

pub fn run() {
    let docker = Arc::new(DockerManager::new());
    let host_metrics = Arc::new(HostMetricsManager::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            docker,
            host_metrics,
        })
        .invoke_handler(tauri::generate_handler![
            get_docker_overview,
            set_docker_socket,
            cmd_list_containers,
            cmd_inspect_container,
            cmd_get_container_stats,
            cmd_start_container,
            cmd_stop_container,
            cmd_restart_container,
            cmd_pause_container,
            cmd_unpause_container,
            cmd_remove_container,
            cmd_get_container_logs,
            cmd_exec_container_command,
            cmd_list_images,
            cmd_inspect_image,
            cmd_pull_image,
            cmd_remove_image,
            cmd_prune_images,
            cmd_list_volumes,
            cmd_create_volume,
            cmd_inspect_volume,
            cmd_remove_volume,
            cmd_prune_volumes,
            cmd_list_networks,
            cmd_inspect_network,
            cmd_create_network,
            cmd_remove_network,
            cmd_prune_networks,
            cmd_list_compose_projects,
            cmd_get_host_telemetry,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Porto desktop application");
}
