package com.homecraft.organizer

import com.homecraft.organizer.themes.ThemeEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ThemeEngineTest {

    @Test
    fun adaptiveColumnsScaleAcrossDeviceSizes() {
        assertEquals(4, ThemeEngine.computeAdaptiveColumns(360))
        assertEquals(5, ThemeEngine.computeAdaptiveColumns(540))
        assertEquals(6, ThemeEngine.computeAdaptiveColumns(840))
    }

    @Test
    fun presetsContainMultipleDistinctThemes() {
        assertTrue(ThemeEngine.presets.size >= 4)
        assertEquals(ThemeEngine.presets.size, ThemeEngine.presets.map { it.id }.distinct().size)
    }
}
