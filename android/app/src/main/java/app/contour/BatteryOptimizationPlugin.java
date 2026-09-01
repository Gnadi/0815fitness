package app.contour;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Whether Android will leave the recording alone.
 *
 * A location foreground service is supposed to be exempt from Doze, and on stock Android
 * it is. Several manufacturers ship an additional layer on top — the one marketed as
 * battery care or app hibernation — which will stop a foreground service anyway, some of
 * them within minutes of the screen going off. On those phones the pivot buys nothing
 * unless the app is on the allow list, and the person is the only one who can put it
 * there.
 *
 * So the app asks, once, from the pre-start screen, and takes no for an answer. This is
 * the smallest surface that can answer "will this ride actually record": one query and
 * one intent.
 */
@CapacitorPlugin(name = "BatteryOptimization")
public class BatteryOptimizationPlugin extends Plugin {

    /** True when the app is already exempt, or when the platform has no such notion. */
    @PluginMethod
    public void isExempt(PluginCall call) {
        JSObject result = new JSObject();
        result.put("exempt", isIgnoringOptimizations());
        call.resolve(result);
    }

    /**
     * Asks for the exemption.
     *
     * The direct request dialog is the one people actually complete, but it is not
     * guaranteed to exist — some builds have no activity for it. Falling back to the
     * battery-optimisation list is worse but still gets there, and failing that the app
     * says so rather than pretending the ride is safe.
     */
    @PluginMethod
    public void requestExemption(PluginCall call) {
        if (isIgnoringOptimizations()) {
            JSObject result = new JSObject();
            result.put("opened", false);
            call.resolve(result);
            return;
        }

        Context context = getContext();
        Intent direct = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                .setData(Uri.parse("package:" + context.getPackageName()));
        Intent list = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);

        for (Intent intent : new Intent[] { direct, list }) {
            if (intent.resolveActivity(context.getPackageManager()) == null) continue;
            getActivity().startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
            return;
        }

        call.reject("No battery optimisation settings screen on this device");
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
