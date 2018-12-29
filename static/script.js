const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

$(document).ready(function () {
    let keyDemoTarget = $("#keyDemoTarget");
    let keyDemoUrlPreview = $("#keyUrlPreview");

    let mouseDemoTarget = $("#mouseDemoTarget");
    let mouseDemoUrlPreview = $("#mouseUrlPreview");

    $(".keyDemoInput").on("change", function (e) {
        refreshKeyDemo();
    });
    $(".keyDemoInput").on("keyup", $.debounce(250, function (e) {
        refreshKeyDemo();
    }));
    keyDemoTarget.on("load", function (e) {
        keyDemoUrlPreview.removeClass("red");
    });
    keyDemoTarget.on("error", function (e) {
        keyDemoUrlPreview.addClass("red");
    });

    $(".mouseDemoInput").on("change", function (e) {
        refreshMouseDemo();
    });
    $(".mouseDemoInput").on("keyup", $.debounce(250, function (e) {
        refreshMouseDemo();
    }));
    mouseDemoTarget.on("load", function (e) {
        mouseDemoUrlPreview.removeClass("red");
    });
    mouseDemoTarget.on("error", function (e) {
        mouseDemoUrlPreview.addClass("red");
    });

    function refreshKeyDemo() {
        let keyLabel = $("#keyLabel").val();
        let keyStyle = $("#keyStyle").val();
        let keySize = $("#keySize").val();
        let keyShape = $("#keyShape").val();
        let keyColor = $("#keyColor").val();
        let keyLabelColor = $("#keyLabelColor").val();
        let keyFontFamily = $("#keyFontFamily").val();
        let keyFontStyle = $("#keyFontStyle").val();
        let keyFontSize = $("#keyFontSize").val();


        $("#keyFontFamily").prop("disabled", keyLabel.startsWith("far:") || keyLabel.startsWith("fas:") || keyLabel.startsWith("fab:")).formSelect();
        $("#keyFontStyle").prop("disabled", keyLabel.startsWith("far:") || keyLabel.startsWith("fas:") || keyLabel.startsWith("fab:")).formSelect();

        let params = {};

        if (keyStyle !== "classic")
            params["style"] = keyStyle;
        if (keySize !== "256")
            params["size"] = keySize;
        if (keyShape !== "square")
            params["shape"] = keyShape;
        if (keyColor !== "#565656")
            params["color"] = keyColor;
        if (keyLabelColor !== "auto")
            params["labelColor"] = keyLabelColor;
        if (keyFontFamily !== "OpenSans")
            params["fontFamily"] = keyFontFamily;
        if (keyFontStyle !== "Regular")
            params["fontStyle"] = keyFontStyle;
        if (keyFontSize !== "auto" && keyFontSize > 0)
            params["fontSize"] = keyFontSize;

        let paramString = $.param(params);
        let url = "https://key.pics/key/" + encodeURIComponent(keyLabel) + ".svg" + (paramString.length > 0 ? "?" + paramString : "");

        keyDemoTarget.attr("src", url);

        keyDemoUrlPreview.val(url);
        M.textareaAutoResize(keyDemoUrlPreview);
    }

    function refreshMouseDemo() {
        let mouseButton = $("#mouseButton").val();
        let mouseSize = $("#mouseSize").val();
        let mouseColor = $("#mouseColor").val();
        let mousePressedColor = $("#mousePressedColor").val();
        let mouseOutline = $("#mouseOutline").is(":checked");
        let mouseLabel = $("#mouseLabel").val();
        let mouseLabelColor = $("#mouseLabelColor").val();
        let mouseFontFamily = $("#mouseFontFamily").val();
        let mouseFontStyle = $("#mouseFontStyle").val();
        let mouseFontSize = $("#mouseFontSize").val();


        $("#mouseFontFamily").prop("disabled", mouseLabel.startsWith("far:") || mouseLabel.startsWith("fas:") || mouseLabel.startsWith("fab:")).formSelect();
        $("#mouseFontStyle").prop("disabled", mouseLabel.startsWith("far:") || mouseLabel.startsWith("fas:") || mouseLabel.startsWith("fab:")).formSelect();


        let params = {};

        if (mouseSize !== "256")
            params["size"] = mouseSize;
        if (mouseColor !== "#565656")
            params["color"] = mouseColor;
        if (mousePressedColor !== "auto")
            params["pressedColor"] = mousePressedColor;
        if (!mouseOutline)
            params["outline"] = "false";
        if (mouseLabel.length > 0)
            params["label"] = mouseLabel;
        if (mouseLabelColor !== "auto")
            params["labelColor"] = mouseLabelColor;
        if (mouseFontFamily !== "OpenSans")
            params["fontFamily"] = mouseFontFamily;
        if (mouseFontStyle !== "Regular")
            params["fontStyle"] = mouseFontStyle;
        if (mouseFontSize !== "auto" && mouseFontSize > 0)
            params["fontSize"] = mouseFontSize;


        let paramString = $.param(params);
        let url = "https://key.pics/mouse/" + encodeURIComponent(mouseButton) + ".svg" + (paramString.length > 0 ? "?" + paramString : "");

        mouseDemoTarget.attr("src", url);

        mouseDemoUrlPreview.val(url);
        M.textareaAutoResize(mouseDemoUrlPreview);
    }

    function randomLetter() {
        return LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }

    // Init
    $('select').formSelect();

    $("#keyLabel").val(randomLetter());
    $.ajax("https://key.pics/fonts").done(function (data) {
        for (let i = 0; i < data.length; i++) {
            if (data[i] === "OpenSans") continue;// already defined
            $("#keyFontFamily").append("<option value='" + data[i] + "'>" + data[i] + "</option>");
            $("#mouseFontFamily").append("<option value='" + data[i] + "'>" + data[i] + "</option>");
        }
        $("#keyFontFamily,#mouseFontFamily").formSelect();
        $("#keyFontFamily,#mouseFontFamily").trigger("change");
    });

    $("#keyFontFamily").on("change", function (e) {
        $("#keyFontLicense").attr("href", "https://key.pics/fonts/" + $("#keyFontFamily").val());
        $.ajax("https://key.pics/fonts/" + $("#keyFontFamily").val() + "/styles").done(function (data) {
            $("#keyFontStyle").empty();
            for (let i = 0; i < data.length; i++) {
                $("#keyFontStyle").append("<option value='" + data[i] + "' " + (data[i] === "Regular" ? "selected" : "") + ">" + data[i] + "</option>")
            }
            $("#keyFontStyle").formSelect();
            refreshKeyDemo();
        });
    });

    $("#mouseFontFamily").on("change", function (e) {
        $("#mouseFontLicense").attr("href", "https://key.pics/fonts/" + $("#mouseFontFamily").val());
        $.ajax("https://key.pics/fonts/" + $("#mouseFontFamily").val() + "/styles").done(function (data) {
            $("#mouseFontStyle").empty();
            for (let i = 0; i < data.length; i++) {
                $("#mouseFontStyle").append("<option value='" + data[i] + "' " + (data[i] === "Regular" ? "selected" : "") + ">" + data[i] + "</option>")
            }
            $("#mouseFontStyle").formSelect();
            refreshMouseDemo();
        });
    });

    refreshKeyDemo();
    refreshMouseDemo();
})