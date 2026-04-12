mod cache;
mod cache_model;
mod canonical;
mod commands;
mod data_sources;
mod errors;
mod normalizers;
mod raw_models;
mod service;
mod user_store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Warn)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_upload::init())
        .invoke_handler(tauri::generate_handler![
            commands::sync_region_data,
            commands::list_operators,
            commands::get_operator_detail,
            commands::get_region_sync_status,
            commands::get_region_terms,
            commands::get_user_favorites,
            commands::toggle_operator_favorite
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
