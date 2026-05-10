package com.anonymous.briqon

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.anonymous.briqon.NativeAlarmModuleSpec

@ReactModule(name = AlarmModule.NAME)
class AlarmModule(reactContext: ReactApplicationContext) :
    NativeAlarmModuleSpec(reactContext) {

    override fun getName(): String = NAME

    override fun hasExactAlarmPermission(promise: Promise) {
        try {
            val alarmManager = reactApplicationContext
                .getSystemService(Context.ALARM_SERVICE) as AlarmManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                promise.resolve(alarmManager.canScheduleExactAlarms())
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERR_PERMISSION", e.message)
        }
    }

    override fun setAlarm(
        timestamp: Double,
        activity: String,
        startTime: String,
        endTime: String,
        scheduleName: String,
        nextActivity: String,
        nextStartTime: String
    ) {
        try {
            val context = reactApplicationContext
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!alarmManager.canScheduleExactAlarms()) {
                    Log.e(NAME, "No exact alarm permission")
                    return
                }
            }

            val intent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra("activity",        activity)
                putExtra("start_time",      startTime)
                putExtra("end_time",        endTime)
                putExtra("schedule_name",   scheduleName)
                putExtra("next_activity",   nextActivity)
                putExtra("next_start_time", nextStartTime)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                timestamp.toInt(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                timestamp.toLong(),
                pendingIntent
            )

            Log.d(NAME, "Alarm set: $activity @ $timestamp | next: $nextActivity")
        } catch (e: Exception) {
            Log.e(NAME, "setAlarm error: ${e.message}")
        }
    }

    // Stops the AlarmService from JS — used by Dismiss and Snooze on the alarm screen
    override fun stopAlarm() {
        try {
            reactApplicationContext.stopService(
                Intent(reactApplicationContext, AlarmService::class.java)
            )
            Log.d(NAME, "AlarmService stopped via stopAlarm()")
        } catch (e: Exception) {
            Log.e(NAME, "stopAlarm error: ${e.message}")
        }
    }

    // Moves the app to the background — equivalent to pressing the home button
    override fun minimizeApp() {
        try {
            // Clear the deep-link intent so Expo Router doesn't re-navigate
            // to the alarm screen the next time the app is brought to foreground
            currentActivity?.intent = android.content.Intent()
            currentActivity?.moveTaskToBack(true)
        } catch (e: Exception) {
            Log.e(NAME, "minimizeApp error: ${e.message}")
        }
    }

    override fun requestExactAlarmPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
        }
    }

    companion object {
        const val NAME = "AlarmModule"
    }
}