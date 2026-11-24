package com.homecraft.organizer

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalConfiguration
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.homecraft.organizer.permissions.PermissionKind
import com.homecraft.organizer.permissions.PermissionManager
import com.homecraft.organizer.scanner.AppScanner
import com.homecraft.organizer.scanner.ScannedApp
import com.homecraft.organizer.themes.ThemeEngine
import com.homecraft.organizer.ui.ActiveHomeLauncherScreen
import com.homecraft.organizer.ui.PermissionGateScreen
import com.homecraft.organizer.ui.ThemeDesignerScreen

enum class OrganizerStep {
    PERMISSIONS,
    DESIGNER,
    LAUNCHER
}

class MainActivity : ComponentActivity() {

    private var refreshTick by mutableIntStateOf(0)

    private val roleLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        refreshTick++
    }

    private val runtimePermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) {
        refreshTick++
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val lifecycleOwner = LocalLifecycleOwner.current
            DisposableEffect(lifecycleOwner) {
                val observer = LifecycleEventObserver { _, event ->
                    if (event == Lifecycle.Event.ON_RESUME) {
                        refreshTick++
                    }
                }
                lifecycleOwner.lifecycle.addObserver(observer)
                onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
            }

            val permissions = remember(refreshTick) { PermissionManager.inspectAll(this) }
            val requiredGranted = remember(refreshTick) {
                PermissionManager.areRequiredPermissionsGranted(this)
            }

            var currentStep by remember {
                mutableStateOf(
                    if (PermissionManager.areRequiredPermissionsGranted(this)) OrganizerStep.LAUNCHER
                    else OrganizerStep.PERMISSIONS
                )
            }

            var scannedApps by remember { mutableStateOf<List<ScannedApp>>(emptyList()) }
            var selectedTheme by remember { mutableStateOf(ThemeEngine.loadSelectedTheme(this)) }

            LaunchedEffect(requiredGranted, refreshTick) {
                if (requiredGranted) {
                    scannedApps = AppScanner.scanAllLaunchableApps(this@MainActivity)
                }
            }

            val screenWidthDp = LocalConfiguration.current.screenWidthDp
            val layout = remember(scannedApps, selectedTheme, screenWidthDp) {
                ThemeEngine.organizeLayout(scannedApps, selectedTheme, screenWidthDp)
            }

            when (currentStep) {
                OrganizerStep.PERMISSIONS -> {
                    PermissionGateScreen(
                        permissions = permissions,
                        allRequiredGranted = requiredGranted,
                        onRequestPermission = { kind ->
                            when (kind) {
                                PermissionKind.DEFAULT_HOME_ROLE -> {
                                    roleLauncher.launch(PermissionManager.createHomeRoleIntent(this))
                                }
                                PermissionKind.USAGE_STATS -> {
                                    startActivity(PermissionManager.createUsageAccessIntent(this))
                                }
                                PermissionKind.POST_NOTIFICATIONS -> {
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                        runtimePermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                    }
                                }
                                PermissionKind.QUERY_PACKAGES, PermissionKind.SET_WALLPAPER -> {
                                    startActivity(
                                        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                            data = android.net.Uri.fromParts("package", packageName, null)
                                        }
                                    )
                                }
                            }
                        },
                        onContinueToScanner = {
                            scannedApps = AppScanner.scanAllLaunchableApps(this)
                            currentStep = OrganizerStep.DESIGNER
                        }
                    )
                }

                OrganizerStep.DESIGNER -> {
                    ThemeDesignerScreen(
                        appsCount = scannedApps.size,
                        presets = ThemeEngine.presets,
                        selectedTheme = selectedTheme,
                        onSelectTheme = { selectedTheme = it },
                        onApplyDesign = { chosen ->
                            ThemeEngine.saveSelectedThemeId(this, chosen.id)
                            ThemeEngine.applyThemeWallpaper(this, chosen)
                            selectedTheme = chosen
                            currentStep = OrganizerStep.LAUNCHER
                        }
                    )
                }

                OrganizerStep.LAUNCHER -> {
                    ActiveHomeLauncherScreen(
                        layout = layout,
                        onLaunchApp = { app -> AppScanner.launchApp(this, app) },
                        onOpenStudio = { currentStep = OrganizerStep.DESIGNER }
                    )
                }
            }
        }
    }
}
