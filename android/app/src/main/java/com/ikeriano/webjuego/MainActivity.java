package com.ikeriano.webjuego;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.MimeTypeMap;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * WebView wrapper for El Comodín 1.0.
 * Serves assets/www from https://appassets.androidplatform.net/ (with HTTP Range
 * support for audio/video), fullscreen immersive, file chooser, back-button dialog.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String ROOT = "www/";
    private static final int REQ_FILE = 4242;

    private WebView web;
    private ValueCallback<Uri[]> fileCb;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true); web.setFocusableInTouchMode(true); web.requestFocus();
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        setContentView(web);
        ocultarBarras();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        WebView.setWebContentsDebuggingEnabled(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return servir(r.getUrl(), r.getRequestHeaders());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });

        if (Build.VERSION.SDK_INT >= 24) {
            ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest r) {
                    return servir(r.getUrl(), r.getRequestHeaders());
                }
            });
        }

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                // Mis audios: respeta accept="audio/*,video/*" y multiple («Añadir audios»)
                java.util.ArrayList<String> tipos = new java.util.ArrayList<>();
                if (p != null && p.getAcceptTypes() != null)
                    for (String a : p.getAcceptTypes()) if (a != null) for (String t : a.split(",")) { t = t.trim(); if (!t.isEmpty() && t.contains("/")) tipos.add(t); }
                if (tipos.size() == 1) i.setType(tipos.get(0));
                else { i.setType("*/*"); if (tipos.size() > 1) i.putExtra(Intent.EXTRA_MIME_TYPES, tipos.toArray(new String[0])); }
                if (p != null && p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try {
                    startActivityForResult(Intent.createChooser(i, "Elegir archivo"), REQ_FILE);
                } catch (Exception e) {
                    fileCb = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("https://" + HOST + "/index.html");
    }

    private WebResourceResponse servir(Uri u, Map<String, String> headers) {
        if (u == null || !HOST.equals(u.getHost())) return null;
        String path = u.getPath();
        if (path == null || path.isEmpty() || path.equals("/")) path = "/index.html";
        if (path.endsWith("/")) path += "index.html";
        path = Uri.decode(path.substring(1));
        String mime = mime(path);
        Map<String, String> h = new HashMap<>();
        h.put("Access-Control-Allow-Origin", "*");
        h.put("Cache-Control", "no-cache");
        h.put("Accept-Ranges", "bytes");
        byte[] data;
        try {
            data = leer(getAssets().open(ROOT + path));
        } catch (IOException e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", h,
                    new ByteArrayInputStream(new byte[0]));
        }
        String range = null;
        if (headers != null) for (Map.Entry<String, String> e : headers.entrySet())
            if ("range".equalsIgnoreCase(e.getKey())) range = e.getValue();
        String enc = mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") ? "utf-8" : null;
        if (range != null && range.trim().startsWith("bytes=")) {
            try {
                String[] p = range.trim().substring(6).split("-", -1);
                long len = data.length, start, end;
                if (p[0].isEmpty()) { start = Math.max(0, len - Long.parseLong(p[1].trim())); end = len - 1; }
                else { start = Long.parseLong(p[0].trim()); end = p.length > 1 && !p[1].trim().isEmpty() ? Math.min(Long.parseLong(p[1].trim()), len - 1) : len - 1; }
                if (start >= len || start > end) {
                    h.put("Content-Range", "bytes */" + len);
                    return new WebResourceResponse(mime, enc, 416, "Range Not Satisfiable", h, new ByteArrayInputStream(new byte[0]));
                }
                int n = (int) (end - start + 1);
                h.put("Content-Range", "bytes " + start + "-" + end + "/" + len);
                h.put("Content-Length", String.valueOf(n));
                return new WebResourceResponse(mime, enc, 206, "Partial Content", h,
                        new ByteArrayInputStream(data, (int) start, n));
            } catch (Exception ignored) { }
        }
        h.put("Content-Length", String.valueOf(data.length));
        return new WebResourceResponse(mime, enc, 200, "OK", h, new ByteArrayInputStream(data));
    }

    private static byte[] leer(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] b = new byte[65536];
        int n;
        while ((n = in.read(b)) > 0) out.write(b, 0, n);
        in.close();
        return out.toByteArray();
    }

    private static String mime(String path) {
        int dot = path.lastIndexOf('.');
        String ext = dot >= 0 ? path.substring(dot + 1).toLowerCase() : "";
        switch (ext) {
            case "html": return "text/html";
            case "js": return "text/javascript";
            case "css": return "text/css";
            case "json": return "application/json";
            case "webmanifest": return "application/manifest+json";
            case "wasm": return "application/wasm";
            case "png": return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "gif": return "image/gif";
            case "webp": return "image/webp";
            case "svg": return "image/svg+xml";
            case "ico": return "image/x-icon";
            case "mp3": return "audio/mpeg";
            case "ogg": return "audio/ogg";
            case "wav": return "audio/wav";
            case "m4a": return "audio/mp4";
            case "mp4": return "video/mp4";
            case "webm": return "video/webm";
            case "woff": return "font/woff";
            case "woff2": return "font/woff2";
            case "ttf": return "font/ttf";
            case "otf": return "font/otf";
            case "gltf": return "model/gltf+json";
            case "glb": return "model/gltf-binary";
            case "zip": return "application/zip";
            case "txt": return "text/plain";
        }
        String m = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
        return m != null ? m : "application/octet-stream";
    }

    @SuppressWarnings("deprecation")
    private void ocultarBarras() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) ocultarBarras();
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE && fileCb != null) {
            Uri[] r = null;
            if (res == RESULT_OK && data != null) {
                if (data.getClipData() != null && data.getClipData().getItemCount() > 0) {
                    android.content.ClipData cd = data.getClipData();
                    r = new Uri[cd.getItemCount()];
                    for (int k = 0; k < cd.getItemCount(); k++) r[k] = cd.getItemAt(k).getUri();
                } else if (data.getData() != null) r = new Uri[]{data.getData()};
            }
            fileCb.onReceiveValue(r);
            fileCb = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web != null && web.canGoBack()) { web.goBack(); return; }
        new AlertDialog.Builder(this)
                .setMessage("¿Salir del juego?")
                .setPositiveButton("Salir", (d, w) -> finish())
                .setNegativeButton("Seguir jugando", (d, w) -> d.dismiss())
                .show();
    }

    @Override protected void onPause() { super.onPause(); if (web != null) web.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); ocultarBarras(); }
    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); if (web != null) web.saveState(o); }
    @Override protected void onDestroy() { if (web != null) web.destroy(); super.onDestroy(); }
}
