package com.homecraft.organizer.ui

import android.graphics.drawable.Drawable
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.drawable.toBitmap
import com.homecraft.organizer.permissions.PermissionKind
import com.homecraft.organizer.permissions.PermissionStatus
import com.homecraft.organizer.scanner.ScannedApp
import com.homecraft.organizer.themes.*

@Composable
fun PermissionGateScreen(
    permissions: List<PermissionStatus>,
    allRequiredGranted: Boolean,
    onRequestPermission: (PermissionKind) -> Unit,
    onContinueToScanner: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFFF6F5F1)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.safeDrawing)
                .padding(20.dp)
        ) {
            Text(
                text = "HomeCraft Setup",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF14171A)
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "Grant device permissions so HomeCraft can scan installed apps and reorganize your home screen on any Android phone.",
                fontSize = 14.sp,
                color = Color(0xFF525866)
            )
            Spacer(Modifier.height(20.dp))

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(permissions) { item ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5E7EB))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = item.title,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 15.sp,
                                        color = Color(0xFF14171A)
                                    )
                                    if (item.isRequired) {
                                        Spacer(Modifier.width(8.dp))
                                        Text(
                                            text = "Required",
                                            fontSize = 11.sp,
                                            color = Color(0xFF1F4D3E),
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = item.description,
                                    fontSize = 13.sp,
                                    color = Color(0xFF525866)
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = item.apiRequirement,
                                    fontSize = 11.sp,
                                    color = Color(0xFF8A94A6)
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            if (item.isGranted) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = "Granted",
                                    tint = Color(0xFF16A34A),
                                    modifier = Modifier.size(28.dp)
                                )
                            } else {
                                Button(
                                    onClick = { onRequestPermission(item.kind) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF14171A)),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("Allow", fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onContinueToScanner,
                enabled = allRequiredGranted,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F4D3E))
            ) {
                Text(
                    text = if (allRequiredGranted) "Scan Device Apps & Design Themes" else "Accept Required Permissions Above",
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
fun ThemeDesignerScreen(
    appsCount: Int,
    presets: List<HomeThemePreset>,
    selectedTheme: HomeThemePreset,
    onSelectTheme: (HomeThemePreset) -> Unit,
    onApplyDesign: (HomeThemePreset) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFFF6F5F1)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.safeDrawing)
                .padding(20.dp)
        ) {
            Text(
                text = "Choose Home Design",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF14171A)
            )
            Text(
                text = "$appsCount apps scanned and grouped into smart folders.",
                fontSize = 14.sp,
                color = Color(0xFF525866)
            )
            Spacer(Modifier.height(16.dp))

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(presets) { preset ->
                    val isSelected = preset.id == selectedTheme.id
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectTheme(preset) },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(
                            width = if (isSelected) 2.dp else 1.dp,
                            color = if (isSelected) Color(0xFF1F4D3E) else Color(0xFFE5E7EB)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        Brush.verticalGradient(
                                            listOf(
                                                preset.bgTopHex.toComposeColor(),
                                                preset.bgBottomHex.toComposeColor()
                                            )
                                        )
                                    )
                                    .border(1.dp, Color(0x22000000), RoundedCornerShape(12.dp))
                            )
                            Spacer(Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = preset.name,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 16.sp,
                                    color = Color(0xFF14171A)
                                )
                                Text(
                                    text = preset.subtitle,
                                    fontSize = 13.sp,
                                    color = Color(0xFF525866)
                                )
                                Text(
                                    text = "${preset.folderStyle.name.lowercase().replaceFirstChar { it.uppercase() }} folders · ${preset.iconShape.name.lowercase().replaceFirstChar { it.uppercase() }} icons",
                                    fontSize = 11.sp,
                                    color = Color(0xFF8A94A6)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Button(
                onClick = { onApplyDesign(selectedTheme) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F4D3E))
            ) {
                Text("Apply ${selectedTheme.name} to Home Screen", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
fun ActiveHomeLauncherScreen(
    layout: OrganizedHomeLayout,
    onLaunchApp: (ScannedApp) -> Unit,
    onOpenStudio: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var expandedFolder by remember { mutableStateOf<SmartFolder?>(null) }

    val theme = layout.theme
    val iconShape: Shape = when (theme.iconShape) {
        IconShapeStyle.CIRCLE -> CircleShape
        IconShapeStyle.SQUIRCLE -> RoundedCornerShape(16.dp)
        IconShapeStyle.ROUNDED -> RoundedCornerShape(12.dp)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(theme.bgTopHex.toComposeColor(), theme.bgBottomHex.toComposeColor())
                )
            )
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = theme.name,
                    color = theme.textHex.toComposeColor(),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold
                )
                IconButton(onClick = onOpenStudio) {
                    Icon(
                        imageVector = Icons.Default.Tune,
                        contentDescription = "Customize Home Theme",
                        tint = theme.textHex.toComposeColor()
                    )
                }
            }

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search apps & folders") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = theme.cardHex.toComposeColor(),
                    unfocusedContainerColor = theme.cardHex.toComposeColor(),
                    focusedTextColor = theme.textHex.toComposeColor(),
                    unfocusedTextColor = theme.textHex.toComposeColor()
                )
            )

            if (searchQuery.isNotBlank()) {
                val filtered = (layout.dockApps + layout.folders.flatMap { it.apps })
                    .distinctBy { it.id }
                    .filter { it.label.contains(searchQuery, ignoreCase = true) }

                LazyVerticalGrid(
                    columns = GridCells.Fixed(layout.columns),
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filtered, key = { it.id }) { app ->
                        AppIconTile(app = app, shape = iconShape, textColor = theme.textHex.toComposeColor()) {
                            onLaunchApp(app)
                        }
                    }
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(layout.folders, key = { it.id }) { folder ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { expandedFolder = folder },
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = theme.cardHex.toComposeColor())
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Folder,
                                        contentDescription = null,
                                        tint = theme.accentHex.toComposeColor(),
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        text = folder.name,
                                        color = theme.textHex.toComposeColor(),
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                Spacer(Modifier.height(10.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    folder.apps.take(4).forEach { app ->
                                        DrawableBox(drawable = app.icon, label = app.label, shape = iconShape, sizeDp = 32)
                                    }
                                }
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    text = "${folder.apps.size} apps",
                                    fontSize = 11.sp,
                                    color = theme.textHex.toComposeColor().copy(alpha = 0.65f)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(theme.cardHex.toComposeColor())
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                layout.dockApps.forEach { app ->
                    AppIconTile(
                        app = app,
                        shape = iconShape,
                        textColor = theme.textHex.toComposeColor(),
                        showLabel = false
                    ) {
                        onLaunchApp(app)
                    }
                }
            }
        }

        expandedFolder?.let { folder ->
            AlertDialog(
                onDismissRequest = { expandedFolder = null },
                title = { Text(folder.name, fontWeight = FontWeight.Bold) },
                text = {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        modifier = Modifier.heightIn(max = 320.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(folder.apps, key = { it.id }) { app ->
                            AppIconTile(app = app, shape = iconShape, textColor = MaterialTheme.colorScheme.onSurface) {
                                expandedFolder = null
                                onLaunchApp(app)
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { expandedFolder = null }) {
                        Text("Close")
                    }
                }
            )
        }
    }
}

@Composable
private fun AppIconTile(
    app: ScannedApp,
    shape: Shape,
    textColor: Color,
    showLabel: Boolean = true,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(4.dp)
    ) {
        DrawableBox(drawable = app.icon, label = app.label, shape = shape, sizeDp = 48)
        if (showLabel) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = app.label,
                color = textColor,
                fontSize = 11.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun DrawableBox(drawable: Drawable?, label: String, shape: Shape, sizeDp: Int) {
    val bitmap = remember(drawable) {
        runCatching { drawable?.toBitmap(width = 96, height = 96)?.asImageBitmap() }.getOrNull()
    }
    if (bitmap != null) {
        Image(
            bitmap = bitmap,
            contentDescription = label,
            modifier = Modifier
                .size(sizeDp.dp)
                .clip(shape)
        )
    } else {
        Box(
            modifier = Modifier
                .size(sizeDp.dp)
                .clip(shape)
                .background(Color(0xFF2B3540)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = label.take(1).uppercase(),
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
