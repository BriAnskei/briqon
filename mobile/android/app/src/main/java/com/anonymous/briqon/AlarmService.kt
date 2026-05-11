package com.anonymous.briqon

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

class AlarmService : Service() {

    private var mediaPlayer: MediaPlayer? = null

    override fun onStartCommand(intent: Intent?, startFlags: Int, startId: Int): Int {
        val id            = intent?.getIntExtra("id", -1) ?: -1
        val activity      = intent?.getStringExtra("activity")        ?: "Alarm"
        val startTime     = intent?.getStringExtra("start_time")      ?: ""
        val endTime       = intent?.getStringExtra("end_time")        ?: ""
        val scheduleName  = intent?.getStringExtra("schedule_name")   ?: ""
        val nextActivity  = intent?.getStringExtra("next_activity")   ?: ""
        val nextStartTime = intent?.getStringExtra("next_start_time") ?: ""

        val isInteractive = (getSystemService(POWER_SERVICE) as PowerManager).isInteractive

        // ── AlarmActivity intent (lock screen path) ───────────────────────────
        val alarmActivityIntent = Intent(this, AlarmActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
            putExtra("id",              id)
            putExtra("activity",        activity)
            putExtra("start_time",      startTime)
            putExtra("end_time",        endTime)
            putExtra("schedule_name",   scheduleName)
            putExtra("next_activity",   nextActivity)
            putExtra("next_start_time", nextStartTime)
        }
        val alarmActivityPendingIntent = PendingIntent.getActivity(
            this, 0, alarmActivityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // ── Deep-link intent (notification tap on unlocked screen → RN AlarmScreen) ──
        val uri = Uri.Builder()
            .scheme("reactnativecourse")
            .authority("")
            .appendEncodedPath("alarm")
            .appendQueryParameter("id",              id.toString())
            .appendQueryParameter("activity",        activity)
            .appendQueryParameter("start_time",      startTime)
            .appendQueryParameter("end_time",        endTime)
            .appendQueryParameter("schedule_name",   scheduleName)
            .appendQueryParameter("next_activity",   nextActivity)
            .appendQueryParameter("next_start_time", nextStartTime)
            .build()

        val deepLinkIntent = Intent(Intent.ACTION_VIEW, uri, this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val deepLinkPendingIntent = PendingIntent.getActivity(
            this, 1, deepLinkIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // ── Dismiss action ────────────────────────────────────────────────────
        val dismissPendingIntent = PendingIntent.getBroadcast(
            this, 100,
            Intent(this, AlarmActionReceiver::class.java).apply { action = "DISMISS_ALARM" },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // ── Snooze action ─────────────────────────────────────────────────────
        val snoozePendingIntent = PendingIntent.getBroadcast(
            this, 101,
            Intent(this, AlarmActionReceiver::class.java).apply {
                action = "SNOOZE_ALARM"
                putExtra("id",              id)
                putExtra("activity",        activity)
                putExtra("start_time",      startTime)
                putExtra("end_time",        endTime)
                putExtra("schedule_name",   scheduleName)
                putExtra("next_activity",   nextActivity)
                putExtra("next_start_time", nextStartTime)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // ── Notification channel ──────────────────────────────────────────────
        val channelId = "alarm_channel"
        NotificationChannel(channelId, "Alarm Notifications", NotificationManager.IMPORTANCE_MAX)
            .apply {
                setBypassDnd(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            .also { getSystemService(NotificationManager::class.java).createNotificationChannel(it) }

        // ── Build notification ────────────────────────────────────────────────
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setContentTitle(scheduleName.ifEmpty { "Scheduled Activity" })
            .setContentText(activity)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setContentIntent(deepLinkPendingIntent)    // tap → RN AlarmScreen (unlocked)
            .addAction(0, "Dismiss",         dismissPendingIntent)
            .addAction(0, "Snooze · 5 min",  snoozePendingIntent)

        // Lock screen only: full-screen intent launches AlarmActivity instantly
        if (!isInteractive) {
            notificationBuilder.setFullScreenIntent(alarmActivityPendingIntent, true)
        }

        val notification = notificationBuilder.build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(1, notification)
        }

        if (!isInteractive) {
            // Belt-and-suspenders: also call startActivity in case fullScreenIntent
            // is suppressed by the system (some OEM ROMs throttle it)
            Log.d("AlarmService", "Screen off → launching AlarmActivity")
            startActivity(alarmActivityIntent)
        } else {
            Log.d("AlarmService", "Screen on → notification only")
        }

        // ── Alarm sound (always) ──────────────────────────────────────────────
        Thread {
            try {
                val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

                mediaPlayer = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    setDataSource(applicationContext, alarmUri)
                    setOnPreparedListener { it.start() }
                    setOnErrorListener { _, what, extra ->
                        Log.e("AlarmService", "MediaPlayer error: what=$what extra=$extra")
                        stopSelf()
                        true
                    }
                    prepareAsync()
                }
            } catch (e: Exception) {
                Log.e("AlarmService", "MediaPlayer setup failed: ${e.message}")
                stopSelf()
            }
        }.start()

        return START_STICKY
    }

    override fun onDestroy() {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
