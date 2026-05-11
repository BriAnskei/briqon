package com.anonymous.briqon

import android.animation.ObjectAnimator
import android.app.Activity
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import java.util.Calendar

class AlarmActivity : Activity() {

    private val clockHandler = Handler(Looper.getMainLooper())
    private var clockRunnable: Runnable? = null
    private var countDownTimer: CountDownTimer? = null
    private val animators = mutableListOf<ObjectAnimator>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over the lock screen and wake the display
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }

        setContentView(R.layout.activity_alarm)

        // ── Read extras passed from AlarmService ──────────────────────────────
        val id            = intent.getIntExtra("id", -1)
        val activityName  = intent.getStringExtra("activity")        ?: "Activity"
        val startTime     = intent.getStringExtra("start_time")      ?: "--"
        val endTime       = intent.getStringExtra("end_time")        ?: "--"
        val scheduleName  = intent.getStringExtra("schedule_name")   ?: ""
        val nextActivity  = intent.getStringExtra("next_activity")   ?: ""
        val nextStartTime = intent.getStringExtra("next_start_time") ?: ""

        // ── Bind views ────────────────────────────────────────────────────────
        val tvScheduleName    = findViewById<TextView>(R.id.tvScheduleName)
        val tvClockTime       = findViewById<TextView>(R.id.tvClockTime)
        val tvClockAmpm       = findViewById<TextView>(R.id.tvClockAmpm)
        val tvActivityName    = findViewById<TextView>(R.id.tvActivityName)
        val tvStartTime       = findViewById<TextView>(R.id.tvStartTime)
        val tvEndTime         = findViewById<TextView>(R.id.tvEndTime)
        val upNextCard        = findViewById<View>(R.id.upNextCard)
        val tvNextActivity    = findViewById<TextView>(R.id.tvNextActivity)
        val tvNextStartTime   = findViewById<TextView>(R.id.tvNextStartTime)
        val actionsLayout     = findViewById<View>(R.id.actionsLayout)
        val btnDismiss        = findViewById<View>(R.id.btnDismiss)
        val btnSnooze         = findViewById<View>(R.id.btnSnooze)
        val snoozedCard       = findViewById<View>(R.id.snoozedCard)
        val tvSnoozeCountdown = findViewById<TextView>(R.id.tvSnoozeCountdown)
        val dotView           = findViewById<View>(R.id.activityDot)
        val ring1             = findViewById<View>(R.id.ring1)
        val ring2             = findViewById<View>(R.id.ring2)
        val ring3             = findViewById<View>(R.id.ring3)

        // ── Populate text ─────────────────────────────────────────────────────
        if (scheduleName.isNotEmpty()) {
            tvScheduleName.text       = scheduleName
            tvScheduleName.visibility = View.VISIBLE
        }
        tvActivityName.text = activityName
        tvStartTime.text    = startTime
        tvEndTime.text      = endTime

        if (nextActivity.isNotEmpty()) {
            upNextCard.visibility   = View.VISIBLE
            tvNextActivity.text     = nextActivity
            if (nextStartTime.isNotEmpty()) {
                tvNextStartTime.text       = nextStartTime
                tvNextStartTime.visibility = View.VISIBLE
            }
        }

        // ── Live clock (ticks every second) ───────────────────────────────────
        clockRunnable = object : Runnable {
            override fun run() {
                val cal  = Calendar.getInstance()
                var hour = cal.get(Calendar.HOUR_OF_DAY)
                val min  = cal.get(Calendar.MINUTE)
                val ampm = if (hour >= 12) "PM" else "AM"
                hour = if (hour % 12 == 0) 12 else hour % 12
                tvClockTime.text = "${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}"
                tvClockAmpm.text = ampm
                clockHandler.postDelayed(this, 1000)
            }
        }
        clockHandler.post(clockRunnable!!)

        // ── Pulsing rings ─────────────────────────────────────────────────────
        startPulse(ring1, 0L)
        startPulse(ring2, 600L)
        startPulse(ring3, 1200L)

        // ── Blinking activity dot ─────────────────────────────────────────────
        ObjectAnimator.ofFloat(dotView, "alpha", 1f, 0.15f).apply {
            duration    = 700
            repeatCount = ObjectAnimator.INFINITE
            repeatMode  = ObjectAnimator.REVERSE
        }.also { it.start(); animators.add(it) }

        // ── Dismiss ───────────────────────────────────────────────────────────
        btnDismiss.setOnClickListener {
            stopAlarmService()
            finish()
        }

        // ── Snooze ────────────────────────────────────────────────────────────
        btnSnooze.setOnClickListener {
            stopAlarmService()
            rescheduleAlarm(id, activityName, startTime, endTime, scheduleName, nextActivity, nextStartTime)
            actionsLayout.visibility = View.GONE
            snoozedCard.visibility   = View.VISIBLE
            startSnoozeCountdown(tvSnoozeCountdown)
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun startPulse(view: View, delay: Long) {
        listOf("scaleX", "scaleY").forEach { prop ->
            ObjectAnimator.ofFloat(view, prop, 1f, 1.04f).apply {
                duration    = 1500
                repeatCount = ObjectAnimator.INFINITE
                repeatMode  = ObjectAnimator.REVERSE
                startDelay  = delay
            }.also { it.start(); animators.add(it) }
        }
    }

    private fun startSnoozeCountdown(tvCountdown: TextView) {
        countDownTimer = object : CountDownTimer(300_000L, 1000L) {
            override fun onTick(ms: Long) {
                val secs = ms / 1000
                tvCountdown.text = "${secs / 60}:${(secs % 60).toString().padStart(2, '0')}"
            }
            override fun onFinish() { finish() }
        }.start()
    }

    private fun stopAlarmService() {
        stopService(Intent(this, AlarmService::class.java))
    }

    private fun rescheduleAlarm(
        id: Int, activity: String, startTime: String, endTime: String,
        scheduleName: String, nextActivity: String, nextStartTime: String
    ) {
        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) return

        val intent = Intent(this, AlarmReceiver::class.java).apply {
            putExtra("id",              id)
            putExtra("activity",        activity)
            putExtra("start_time",      startTime)
            putExtra("end_time",        endTime)
            putExtra("schedule_name",   scheduleName)
            putExtra("next_activity",   nextActivity)
            putExtra("next_start_time", nextStartTime)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            System.currentTimeMillis() + 5 * 60 * 1000L,
            pendingIntent
        )
    }

    // Prevent accidental back-press dismissal
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() = Unit

    override fun onDestroy() {
        clockRunnable?.let { clockHandler.removeCallbacks(it) }
        countDownTimer?.cancel()
        animators.forEach { it.cancel() }
        super.onDestroy()
    }
}