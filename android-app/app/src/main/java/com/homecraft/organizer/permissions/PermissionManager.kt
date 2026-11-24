package com.homecraft.organizer.permissions

import android.Manifest
import android.app.AppOpsManager
import android.app.WallpaperManager
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat

enum class PermissionKind {
    QUERY_PACKAGES,
    DEFAULT_HOME_ROLE,
    SET_WALLPAPER,
    USAGE_STATS,
    POST_NOTIFICATIONS
}

data class PermissionStatus(
    val kind: PermissionKind,
    val title: String,
    val description: String,
    val isRequired: Boolean,
    val isGranted: Boolean,
    val apiRequirement: String
)

object PermissionManager {

    fun inspectAll(context: Context): List<PermissionStatus> {
        return listOf(
            PermissionStatus(
                kind = PermissionKind.QUERY_PACKAGES,
                title = "App Inventory Access",
                description = "Scans every installed application across all user profiles and OEM skins.",
                isRequired = true,
                isGranted = hasPackageQueryAccess(context),
                apiRequirement = "Android 8.0+ (QUERY_ALL_PACKAGES)"
            ),
            PermissionStatus(
                kind = PermissionKind.DEFAULT_HOME_ROLE,
                title = "Default Home Launcher Role",
                description = "Allows HomeCraft to reorganize your active home screen, folders, and dock on any device.",
                isRequired = true,
                isGranted = isDefaultHomeLauncher(context),
                apiRequirement = "RoleManager.ROLE_HOME / ACTION_HOME_SETTINGS"
            ),
            PermissionStatus(
                kind = PermissionKind.SET_WALLPAPER,
                title = "Wallpaper & Surface Styling",
                description = "Applies curated theme wallpapers matched to your chosen home screen design.",
                isRequired = false,
                isGranted = hasWallpaperAccess(context),
                apiRequirement = "SET_WALLPAPER"
            ),
            PermissionStatus(
                kind = PermissionKind.USAGE_STATS,
                title = "Usage Frequency Ranking",
                description = "Ranks your most-used apps onto Page 1 and the Dock automatically.",
                isRequired = false,
                isGranted = hasUsageStatsPermission(context),
                apiRequirement = "AppOpsManager.OPSTR_GET_USAGE_STATS"
            ),
            PermissionStatus(
                kind = PermissionKind.POST_NOTIFICATIONS,
                title = "Folder & Sync Alerts",
                description = "Notifies you when newly installed apps are auto-sorted into folders.",
                isRequired = false,
                isGranted = hasNotificationPermission(context),
                apiRequirement = "Android 13+ POST_NOTIFICATIONS"
            )
        )
    }

    fun areRequiredPermissionsGranted(context: Context): Boolean {
        return hasPackageQueryAccess(context) && isDefaultHomeLauncher(context)
    }

    fun hasPackageQueryAccess(context: Context): Boolean {
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val resolved = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.packageManager.queryIntentActivities(
                intent,
                PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong())
            )
        } else {
            @Suppress("DEPRECATION")
            context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_ALL)
        }
        return resolved.isNotEmpty()
    }

    fun isDefaultHomeLauncher(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = context.getSystemService(RoleManager::class.java)
            if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_HOME)) {
                return roleManager.isRoleHeld(RoleManager.ROLE_HOME)
            }
        }
        val homeIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val resolveInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.packageManager.resolveActivity(
                homeIntent,
                PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY.toLong())
            )
        } else {
            @Suppress("DEPRECATION")
            context.packageManager.resolveActivity(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)
        }
        return resolveInfo?.activityInfo?.packageName == context.packageName
    }

    fun createHomeRoleIntent(context: Context): Intent {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = context.getSystemService(RoleManager::class.java)
            if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_HOME)) {
                return roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME)
            }
        }
        val homeSettingsIntent = Intent(Settings.ACTION_HOME_SETTINGS)
        return if (homeSettingsIntent.resolveActivity(context.packageManager) != null) {
            homeSettingsIntent
        } else {
            Intent(Settings.ACTION_SETTINGS)
        }
    }

    fun hasWallpaperAccess(context: Context): Boolean {
        val wm = WallpaperManager.getInstance(context)
        return wm.isWallpaperSupported && wm.isSetWallpaperAllowed
    }

    fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun createUsageAccessIntent(context: Context): Intent {
        val targeted = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            data = Uri.fromParts("package", context.packageName, null)
        }
        return if (targeted.resolveActivity(context.packageManager) != null) {
            targeted
        } else {
            Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        }
    }

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }
}
