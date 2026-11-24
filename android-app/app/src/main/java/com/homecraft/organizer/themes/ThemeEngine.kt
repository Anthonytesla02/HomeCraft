package com.homecraft.organizer.themes

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import androidx.compose.ui.graphics.Color
import com.homecraft.organizer.permissions.PermissionManager
import com.homecraft.organizer.scanner.AppCategory
import com.homecraft.organizer.scanner.ScannedApp

enum class IconShapeStyle {
    SQUIRCLE,
    CIRCLE,
    ROUNDED
}

enum class FolderVisualStyle {
    BENTO,
    COMPACT,
    MINIMAL
}

data class HomeThemePreset(
    val id: String,
    val name: String,
    val subtitle: String,
    val isDark: Boolean,
    val bgTopHex: Long,
    val bgBottomHex: Long,
    val cardHex: Long,
    val textHex: Long,
    val accentHex: Long,
    val iconShape: IconShapeStyle,
    val folderStyle: FolderVisualStyle,
    val columnsOffset: Int = 0
)

data class SmartFolder(
    val id: String,
    val name: String,
    val category: AppCategory,
    val apps: List<ScannedApp>
)

data class OrganizedHomeLayout(
    val theme: HomeThemePreset,
    val columns: Int,
    val dockApps: List<ScannedApp>,
    val folders: List<SmartFolder>
)

object ThemeEngine {

    val presets: List<HomeThemePreset> = listOf(
        HomeThemePreset(
            id = "editorial-linen",
            name = "Swiss Editorial",
            subtitle = "Warm alabaster surface with squircle folders",
            isDark = false,
            bgTopHex = 0xFFF5F2EC,
            bgBottomHex = 0xFFE5DFD3,
            cardHex = 0xE6FFFFFF,
            textHex = 0xFF14171A,
            accentHex = 0xFF1F4D3E,
            iconShape = IconShapeStyle.SQUIRCLE,
            folderStyle = FolderVisualStyle.BENTO
        ),
        HomeThemePreset(
            id = "nordic-slate",
            name = "Nordic Slate",
            subtitle = "Deep matte slate layers with high-legibility grid",
            isDark = true,
            bgTopHex = 0xFF18222D,
            bgBottomHex = 0xFF0E141B,
            cardHex = 0xCC1E2936,
            textHex = 0xFFF1F5F9,
            accentHex = 0xFF5FA8D3,
            iconShape = IconShapeStyle.ROUNDED,
            folderStyle = FolderVisualStyle.COMPACT
        ),
        HomeThemePreset(
            id = "botanical-mist",
            name = "Botanical Mist",
            subtitle = "Frosted sage glass with circular calm icons",
            isDark = false,
            bgTopHex = 0xFFEBF0EC,
            bgBottomHex = 0xFFD2DDD5,
            cardHex = 0xD9F8FAF8,
            textHex = 0xFF1A241E,
            accentHex = 0xFF2D6A4F,
            iconShape = IconShapeStyle.CIRCLE,
            folderStyle = FolderVisualStyle.BENTO
        ),
        HomeThemePreset(
            id = "oled-obsidian",
            name = "OLED Obsidian",
            subtitle = "True-black battery-saving minimal workspace",
            isDark = true,
            bgTopHex = 0xFF090A0C,
            bgBottomHex = 0xFF000000,
            cardHex = 0xD915171C,
            textHex = 0xFFF8FAFC,
            accentHex = 0xFFE2E8F0,
            iconShape = IconShapeStyle.SQUIRCLE,
            folderStyle = FolderVisualStyle.MINIMAL
        )
    )

    fun computeAdaptiveColumns(screenWidthDp: Int): Int {
        return when {
            screenWidthDp >= 720 -> 6
            screenWidthDp >= 500 -> 5
            else -> 4
        }
    }

    fun organizeLayout(
        apps: List<ScannedApp>,
        theme: HomeThemePreset,
        screenWidthDp: Int
    ): OrganizedHomeLayout {
        val columns = (computeAdaptiveColumns(screenWidthDp) + theme.columnsOffset).coerceIn(4, 6)
        val dockApps = apps.take(columns.coerceAtMost(4))
        val dockIds = dockApps.map { it.id }.toSet()

        val folders = AppCategory.entries.mapNotNull { cat ->
            val groupApps = apps.filter { it.category == cat && it.id !in dockIds }
            if (groupApps.isEmpty()) null
            else SmartFolder(
                id = cat.name.lowercase(),
                name = cat.label,
                category = cat,
                apps = groupApps
            )
        }.sortedByDescending { folder -> folder.apps.sumOf { it.usageScore } }

        return OrganizedHomeLayout(
            theme = theme,
            columns = columns,
            dockApps = dockApps,
            folders = folders
        )
    }

    fun applyThemeWallpaper(context: Context, theme: HomeThemePreset): Boolean {
        if (!PermissionManager.hasWallpaperAccess(context)) return false
        return runCatching {
            val metrics = context.resources.displayMetrics
            val width = metrics.widthPixels.coerceAtLeast(1080)
            val height = metrics.heightPixels.coerceAtLeast(2400)
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                shader = LinearGradient(
                    0f, 0f, 0f, height.toFloat(),
                    theme.bgTopHex.toInt(),
                    theme.bgBottomHex.toInt(),
                    Shader.TileMode.CLAMP
                )
            }
            canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
            WallpaperManager.getInstance(context).setBitmap(bitmap)
            bitmap.recycle()
            true
        }.getOrDefault(false)
    }

    fun saveSelectedThemeId(context: Context, themeId: String) {
        context.getSharedPreferences("homecraft_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("active_theme_id", themeId)
            .apply()
    }

    fun loadSelectedTheme(context: Context): HomeThemePreset {
        val savedId = context.getSharedPreferences("homecraft_prefs", Context.MODE_PRIVATE)
            .getString("active_theme_id", null)
        return presets.firstOrNull { it.id == savedId } ?: presets.first()
    }
}

fun Long.toComposeColor(): Color = Color(this)
