package com.anonymous.briqon

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Forward every extra that was bundled at schedule time
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra("id",              intent.getIntExtra("id", -1))
            putExtra("activity",        intent.getStringExtra("activity") ?: "")
            putExtra("start_time",      intent.getStringExtra("start_time") ?: "")
            putExtra("end_time",        intent.getStringExtra("end_time") ?: "")
            putExtra("schedule_name",   intent.getStringExtra("schedule_name") ?: "")
            putExtra("next_activity",   intent.getStringExtra("next_activity") ?: "")
            putExtra("next_start_time", intent.getStringExtra("next_start_time") ?: "")
        }
        context.startForegroundService(serviceIntent)
    }
}