package com.homecraft.organizer.scanner

import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.LauncherApps
import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.UserHandle
import android.os.UserManager
import com.homecraft.organizer.permissions.PermissionManager

enum class AppCategory(val label: String) {
    COMMUNICATION("Communication"),
    PRODUCTIVITY("Productivity"),
    MEDIA("Media"),
    FINANCE("Finance"),
    UTILITIES("Utilities"),
    SOCIAL("Social"),
    NAVIGATION("Navigation"),
    GAMES("Games")
}

data class ScannedApp(
    val id: String,
    val label: String,
    val packageName: String,
    val componentName: ComponentName,
    val userHandle: UserHandle,
    val category: AppCategory,
    val usageScore: Int,
    val icon: Drawable?
)

object AppScanner {

    fun scanAllLaunchableApps(context: Context): List<ScannedApp> {
        val launcherApps = context.getSystemService(Context.LAUNCHER_APPS_SERVICE) as? LauncherApps
        val userManager = context.getSystemService(Context.USER_SERVICE) as? UserManager
        val usageScores = loadUsageScores(context)

        val discovered = mutableListOf<ScannedApp>()
        val seenKeys = mutableSetOf<String>()

        if (launcherApps != null && userManager != null) {
            for (profile in userManager.userProfiles) {
                val activities = launcherApps.getActivityList(null, profile)
                for (info in activities) {
                    if (info.componentName.packageName == context.packageName) continue
                    val key = "${info.componentName.flattenToShortString()}:${profile.hashCode()}"
                    if (!seenKeys.add(key)) continue

                    val label = info.label?.toString()?.trim().orEmpty().ifEmpty {
                        info.componentName.packageName
                    }
                    val appInfo = info.applicationInfo
                    val category = classifyPackage(
                        packageName = info.componentName.packageName,
                        label = label,
                        declaredCategory = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) appInfo.category else -1
                    )
                    discovered += ScannedApp(
                        id = key,
                        label = label,
                        packageName = info.componentName.packageName,
                        componentName = info.componentName,
                        userHandle = profile,
                        category = category,
                        usageScore = usageScores[info.componentName.packageName] ?: defaultScoreFor(category),
                        icon = runCatching { info.getBadgedIcon(0) }.getOrNull()
                    )
                }
            }
        }

        if (discovered.isEmpty()) {
            // Fallback for older or restricted OEM profiles
            val pm = context.packageManager
            val mainIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            val resolved = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.queryIntentActivities(mainIntent, PackageManager.ResolveInfoFlags.of(0L))
            } else {
                @Suppress("DEPRECATION")
                pm.queryIntentActivities(mainIntent, 0)
            }
            val profile = android.os.Process.myUserHandle()
            for (item in resolved) {
                val pkg = item.activityInfo.packageName
                if (pkg == context.packageName) continue
                val component = ComponentName(pkg, item.activityInfo.name)
                val key = component.flattenToShortString()
                if (!seenKeys.add(key)) continue
                val label = item.loadLabel(pm).toString()
                val category = classifyPackage(pkg, label, item.activityInfo.applicationInfo.category)
                discovered += ScannedApp(
                    id = key,
                    label = label,
                    packageName = pkg,
                    componentName = component,
                    userHandle = profile,
                    category = category,
                    usageScore = usageScores[pkg] ?: defaultScoreFor(category),
                    icon = runCatching { item.loadIcon(pm) }.getOrNull()
                )
            }
        }

        return discovered.sortedByDescending { it.usageScore }
    }

    fun launchApp(context: Context, app: ScannedApp): Boolean {
        val launcherApps = context.getSystemService(Context.LAUNCHER_APPS_SERVICE) as? LauncherApps
        if (launcherApps != null) {
            return runCatching {
                launcherApps.startMainActivity(app.componentName, app.userHandle, null, null)
                true
            }.getOrDefault(false)
        }
        val launchIntent = context.packageManager.getLaunchIntentForPackage(app.packageName) ?: return false
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return runCatching {
            context.startActivity(launchIntent)
            true
        }.getOrDefault(false)
    }

    fun classifyPackage(packageName: String, label: String, declaredCategory: Int): AppCategory {
        val p = packageName.lowercase()
        val l = label.lowercase()

        if (p.contains("whatsapp") || p.contains("dialer") || p.contains("messaging") ||
            p.contains("telegram") || p.contains("signal") || p.contains("discord") ||
            p.contains("slack") || p.contains("gm") || p.contains("mail") || l.contains("messages")
        ) {
            return AppCategory.COMMUNICATION
        }
        if (p.contains("bank") || p.contains("chase") || p.contains("paypal") ||
            p.contains("venmo") || p.contains("wallet") || p.contains("revolut") || l.contains("pay")
        ) {
            return AppCategory.FINANCE
        }
        if (p.contains("maps") || p.contains("uber") || p.contains("lyft") ||
            p.contains("waze") || p.contains("transit") || l.contains("maps")
        ) {
            return AppCategory.NAVIGATION
        }
        if (p.contains("instagram") || p.contains("tiktok") || p.contains("reddit") ||
            p.contains("twitter") || p.contains("facebook") || p.contains("threads")
        ) {
            return AppCategory.SOCIAL
        }
        if (p.contains("docs") || p.contains("notion") || p.contains("obsidian") ||
            p.contains("todoist") || p.contains("calendar") || p.contains("drive") || p.contains("notes")
        ) {
            return AppCategory.PRODUCTIVITY
        }
        if (p.contains("camera") || p.contains("calculator") || p.contains("clock") ||
            p.contains("settings") || p.contains("files") || p.contains("browser") || p.contains("chrome")
        ) {
            return AppCategory.UTILITIES
        }

        return when (declaredCategory) {
            ApplicationInfo.CATEGORY_GAME -> AppCategory.GAMES
            ApplicationInfo.CATEGORY_AUDIO, ApplicationInfo.CATEGORY_VIDEO, ApplicationInfo.CATEGORY_IMAGE -> AppCategory.MEDIA
            ApplicationInfo.CATEGORY_SOCIAL -> AppCategory.SOCIAL
            ApplicationInfo.CATEGORY_PRODUCTIVITY -> AppCategory.PRODUCTIVITY
            ApplicationInfo.CATEGORY_MAPS -> AppCategory.NAVIGATION
            else -> AppCategory.UTILITIES
        }
    }

    private fun loadUsageScores(context: Context): Map<String, Int> {
        if (!PermissionManager.hasUsageStatsPermission(context)) return emptyMap()
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return emptyMap()
        val end = System.currentTimeMillis()
        val start = end - 14L * 24L * 60L * 60L * 1000L
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end) ?: return emptyMap()
        val totals = mutableMapOf<String, Long>()
        for (stat in stats) {
            totals[stat.packageName] = (totals[stat.packageName] ?: 0L) + stat.totalTimeInForeground
        }
        val maxTime = totals.values.maxOrNull()?.coerceAtLeast(1L) ?: 1L
        return totals.mapValues { (_, ms) -> ((ms.toDouble() / maxTime.toDouble()) * 100.0).toInt().coerceIn(5, 100) }
    }

    private fun defaultScoreFor(category: AppCategory): Int {
        return when (category) {
            AppCategory.COMMUNICATION -> 85
            AppCategory.UTILITIES -> 75
            AppCategory.PRODUCTIVITY -> 70
            AppCategory.MEDIA -> 65
            AppCategory.NAVIGATION -> 60
            AppCategory.FINANCE -> 55
            AppCategory.SOCIAL -> 50
            AppCategory.GAMES -> 35
        }
    }
}
