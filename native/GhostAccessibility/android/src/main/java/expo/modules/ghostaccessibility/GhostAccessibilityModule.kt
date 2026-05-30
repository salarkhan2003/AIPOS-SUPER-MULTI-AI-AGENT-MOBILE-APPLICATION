package expo.modules.ghostaccessibility

import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GhostAccessibilityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GhostAccessibility")

    AsyncFunction("isServiceEnabled") {
      GhostAccessibilityService.instance != null
    }

    AsyncFunction("openAccessibilitySettings") {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      appContext.reactContext?.startActivity(intent)
    }

    AsyncFunction("tapByText") { packageName: String, text: String ->
      GhostAccessibilityService.tapByText(packageName, text)
    }

    AsyncFunction("typeInField") { packageName: String, fieldText: String, value: String ->
      GhostAccessibilityService.typeInField(packageName, fieldText, value)
    }

    AsyncFunction("getScreenText") { packageName: String ->
      GhostAccessibilityService.getScreenText(packageName)
    }
  }
}
