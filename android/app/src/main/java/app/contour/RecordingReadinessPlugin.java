package app.contour;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * Whether this phone will actually let a session record with the screen off.
 *
 * The foreground service is the mechanism, but two settings outside it can still ruin a
 * ride, and both are the person's to change rather than the app's:
 *
 * Battery optimisation. A location foreground service is exempt from Doze on stock
 * Android. Several manufacturers ship a layer above it that is not, and will stop one
 * within minutes of the screen going off — on those phones the exemption is the whole
 * difference between a recorded ride and the bug this app was rewritten to escape.
 *
 * Notifications. From Android 13 these are opt-in, and a foreground service whose
 * notification is suppressed still runs — but silently. Pre-start tells people they can
 * pocket the phone because the notification will show the session; if that notification
 * cannot appear, the app has promised something it does not deliver, and there is no way
 * back into a running session from the shade. The location plugin only ever asks for
 * location, so this asks for the rest.
 *
 * Everything here is asked once, from pre-start, and takes no for an answer.
 */
@CapacitorPlugin(
    name = "RecordingReadiness",
    permissions = {
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = RecordingReadinessPlugin.NOTIFICATIONS)
    }
)
public class RecordingReadinessPlugin extends Plugin {

    static final String NOTIFICATIONS = "notifications";

    /** Both answers at once, because pre-start wants to say one sentence, not two. */
    @PluginMethod
    public void check(PluginCall call) {
        JSObject result = new JSObject();
        result.put("batteryExempt", isIgnoringOptimizations());
        result.put("notificationsAllowed", areNotificationsAllowed());
        call.resolve(result);
    }

    /**
     * Asks for the battery-optimisation exemption.
     *
     * The direct request dialog is the one people actually complete, but it is not
     * guaranteed to exist — some builds have no activity for it. Falling back to the
     * battery-optimisation list is worse but still gets there, and failing that the app
     * says so rather than pretending the ride is safe.
     */
    @PluginMethod
    public void requestBatteryExemption(PluginCall call) {
        if (isIgnoringOptimizations()) {
            resolveOpened(call, false);
            return;
        }

        Context context = getContext();
        Intent direct = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                .setData(Uri.parse("package:" + context.getPackageName()));
        Intent list = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);

        for (Intent intent : new Intent[] { direct, list }) {
            if (intent.resolveActivity(context.getPackageManager()) == null) continue;
            getActivity().startActivity(intent);
            resolveOpened(call, true);
            return;
        }

        call.reject("No battery optimisation settings screen on this device");
    }

    /** Asks for the notification permission, where there is one to ask for. */
    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || areNotificationsAllowed()) {
            resolveOpened(call, false);
            return;
        }
        if (getPermissionState(NOTIFICATIONS) == PermissionState.DENIED) {
            // Refused for good: the system dialog will not appear again, so the only
            // route left is the app's own settings page.
            getActivity().startActivity(
                new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                    .setData(Uri.parse("package:" + getContext().getPackageName()))
            );
            resolveOpened(call, true);
            return;
        }
        requestPermissionForAlias(NOTIFICATIONS, call, "notificationsCallback");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void notificationsCallback(PluginCall call) {
        resolveOpened(call, true);
    }

    private void resolveOpened(PluginCall call, boolean opened) {
        JSObject result = new JSObject();
        result.put("opened", opened);
        call.resolve(result);
    }

    private boolean areNotificationsAllowed() {
        return NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    }

    private boolean isIgnoringOptimizations() {
        // The whole mechanism arrived in Marshmallow; below that there is nothing to be
        // exempt from, so the honest answer is yes.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        PowerManager power = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        if (power == null) return true;
        return power.isIgnoringBatteryOptimizations(getContext().getPackageName());
    }
}
