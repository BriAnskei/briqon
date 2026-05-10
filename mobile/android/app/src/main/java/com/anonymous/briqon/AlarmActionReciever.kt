package com.anonymous.briqon

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class AlarmActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Always stop the service — kills sound and removes the foreground notification
        context.stopService(Intent(context, AlarmService::class.java))

        if (intent.action == "SNOOZE_ALARM") {
            val activity      = intent.getStringExtra("activity")        ?: ""
            val startTime     = intent.getStringExtra("start_time")      ?: ""
            val endTime       = intent.getStringExtra("end_time")        ?: ""
            val scheduleName  = intent.getStringExtra("schedule_name")   ?: ""
            val nextActivity  = intent.getStringExtra("next_activity")   ?: ""
            val nextStartTime = intent.getStringExtra("next_start_time") ?: ""

            val receiverIntent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra("activity",        activity)
                putExtra("start_time",      startTime)
                putExtra("end_time",        endTime)
                putExtra("schedule_name",   scheduleName)
                putExtra("next_activity",   nextActivity)
                putExtra("next_start_time", nextStartTime)
            }

            // Use current time as request code so it doesn't collide with the original alarm
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                System.currentTimeMillis().toInt(),
                receiverIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val triggerAt = System.currentTimeMillis() + 5 * 60 * 1000L
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                }
            } else {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
        }
        // DISMISS_ALARM needs nothing extra — stopService above is sufficient
    }
}