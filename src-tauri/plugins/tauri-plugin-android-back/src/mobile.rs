use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "app.tauri.androidback";

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> tauri::Result<()> {
    #[cfg(target_os = "android")]
    let _handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "AndroidBackPlugin")?;

    Ok(())
}
