package app.oyasync.fetolsa.villagechief.customer;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 15+ (and always when targeting API 36) draws apps edge to edge.
        // Keep the app clear of the status bar, navigation/gesture bar and keyboard
        // by padding the content view; the strip behind the bars shows the window
        // background (white); dark bar icons come from the theme (styles.xml).
        // Older Android versions report no overlapping insets here, so nothing
        // changes for them.
        getWindow().getDecorView().setBackgroundColor(Color.WHITE);

        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
            Insets sys = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(sys.left, sys.top, sys.right, Math.max(sys.bottom, ime.bottom));
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
