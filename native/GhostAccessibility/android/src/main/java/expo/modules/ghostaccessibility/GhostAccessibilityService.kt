package expo.modules.ghostaccessibility

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class GhostAccessibilityService : AccessibilityService() {
  companion object {
    var instance: GhostAccessibilityService? = null
      private set

    fun tapByText(packageName: String, text: String): Boolean {
      val svc = instance ?: return false
      val root = svc.rootInActiveWindow ?: return false
      if (root.packageName?.toString() != packageName && packageName.isNotEmpty()) {
        // Still try active window
      }
      val node = findByText(root, text) ?: return false
      return node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    fun typeInField(packageName: String, fieldText: String, value: String): Boolean {
      val svc = instance ?: return false
      val root = svc.rootInActiveWindow ?: return false
      val node = findByText(root, fieldText) ?: findEditable(root) ?: return false
      val args = android.os.Bundle()
      args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, value)
      return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    }

    fun getScreenText(packageName: String): String {
      val svc = instance ?: return ""
      val root = svc.rootInActiveWindow ?: return ""
      return collectText(root).joinToString(" ").take(4000)
    }

    private fun findByText(node: AccessibilityNodeInfo?, text: String): AccessibilityNodeInfo? {
      if (node == null) return null
      val desc = node.text?.toString() ?: ""
      val cd = node.contentDescription?.toString() ?: ""
      if (desc.contains(text, true) || cd.contains(text, true)) return node
      for (i in 0 until node.childCount) {
        val found = findByText(node.getChild(i), text)
        if (found != null) return found
      }
      return null
    }

    private fun findEditable(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
      if (node == null) return null
      if (node.isEditable) return node
      for (i in 0 until node.childCount) {
        val found = findEditable(node.getChild(i))
        if (found != null) return found
      }
      return null
    }

    private fun collectText(node: AccessibilityNodeInfo?): List<String> {
      if (node == null) return emptyList()
      val out = mutableListOf<String>()
      node.text?.toString()?.let { if (it.isNotBlank()) out.add(it) }
      for (i in 0 until node.childCount) {
        out.addAll(collectText(node.getChild(i)))
      }
      return out
    }
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
  override fun onInterrupt() {}
  override fun onDestroy() {
    instance = null
    super.onDestroy()
  }
}
