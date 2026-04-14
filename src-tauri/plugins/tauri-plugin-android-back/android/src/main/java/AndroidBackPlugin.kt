package app.tauri.androidback

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.activity.OnBackPressedDispatcherOwner
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@TauriPlugin
class AndroidBackPlugin(private val activity: Activity) : Plugin(activity) {
  private var backCallback: OnBackPressedCallback? = null

  override fun load(webView: WebView) {
    installBackCallbackIfNeeded()
  }

  override fun registerListener(invoke: Invoke) {
    super.registerListener(invoke)
    installBackCallbackIfNeeded()
  }

  @Command
  fun finish(invoke: Invoke) {
    Handler(Looper.getMainLooper()).post {
      activity.finish()
      invoke.resolve()
    }
  }

  private fun installBackCallbackIfNeeded() {
    if (backCallback != null) {
      return
    }

    val dispatcherOwner = activity as? OnBackPressedDispatcherOwner ?: return

    Handler(Looper.getMainLooper()).post {
      if (backCallback != null) {
        return@post
      }

      backCallback = object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          val payload = JSObject()
          payload.put("source", "android")
          trigger("back", payload)
        }
      }.also { callback ->
        dispatcherOwner.onBackPressedDispatcher.addCallback(dispatcherOwner, callback)
      }
    }
  }
}
