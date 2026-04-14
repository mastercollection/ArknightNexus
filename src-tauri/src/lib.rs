use tauri::Manager;

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
    let log_targets = {
        let mut targets = vec![tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::LogDir {
                file_name: Some("app".into()),
            },
        )];

        if cfg!(debug_assertions) {
            targets.push(tauri_plugin_log::Target::new(
                tauri_plugin_log::TargetKind::Webview,
            ));
        }

        targets
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .targets(log_targets)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_upload::init())
        .setup(|app| {
            #[cfg(all(debug_assertions, not(mobile)))]
            {
                for webview in app.webview_windows().values() {
                    let _ = webview.open_devtools();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::sync_region_data,
            commands::ensure_region_fresh,
            commands::list_operators,
            commands::list_items,
            commands::list_building_formulas,
            commands::get_operator_detail,
            commands::get_region_sync_status,
            commands::get_region_terms,
            commands::get_region_stage_codes,
            commands::get_user_favorites,
            commands::toggle_operator_favorite,
            commands::get_user_plan,
            commands::export_user_data,
            commands::import_user_data,
            commands::save_user_plan_selection,
            commands::save_user_plan_operator,
            commands::remove_user_plan_operator,
            commands::save_user_item_count,
            commands::import_user_item_counts
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
