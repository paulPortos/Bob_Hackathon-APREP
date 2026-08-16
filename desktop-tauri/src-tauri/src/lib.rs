// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// -------------------------------------------------------------------
// AI inference placeholder (will be replaced with real model logic).
// This simply echoes the prompt back; later we will load a GGUF model
// with the `candle` crate and return structured JSON.
// -------------------------------------------------------------------
#[tauri::command]
fn run_local_llm(prompt: String) -> Result<String, String> {
    // TODO: replace with actual model loading/inference using `candle`.
    // For now we just return the prompt wrapped in a JSON object.
    let response = serde_json::json!({
        "prompt": prompt,
        "answer": "[model output would appear here]"
    });
    Ok(response.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![greet, run_local_llm])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
