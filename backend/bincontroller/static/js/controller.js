/*
 * ICT1003 Computer Organisation and Architecture
 * Team Exploration Project.
 *
 * SmartBin Controller Client-Side Code.
 * Onsen UI (https://onsen.io) is used for mobile-optimised UI experience.
 *
 * Unless otherwise stated, all code or content in this file is created
 * by and belongs to the Project Team.
 *
 * [ Group P3A ]
 * - Lim Zhao Xiang
 * - Gerald Peh
 * - Ryan Goh
 * - Teng Ming Hui
 * - Ang Jin Yuan Raymous
*/

const POLL_INTERVAL    = 5000;
const CHART_BACKGROUND = ["rgba(255,0,0,0.4)"," rgba(255,165,0,0.4)","rgba(255,255,0,0.4)","rgba(0,128,0,0.4)","rgba(0,0,255,0.4)","rgba(75,0,130,0.4)","rgba(238,130,238,0.4)"];
const CHART_BORDER     = ["rgba(255,0,0,0.7)"," rgba(255,165,0,0.7)","rgba(255,255,0,0.7)","rgba(0,128,0,0.7)","rgba(0,0,255,0.7)","rgba(75,0,130,0.7)","rgba(238,130,238,0.7)"];
const PIECHART_COLOUR  = ["#4ea8de","#48bfe3","#56cfe1","#64dfdf","#80ffdb"];

var auto_refresh = true;
var init_data_analytics_done = false;

var svg_bin_empty  = "";
var svg_bin_green  = "";
var svg_bin_yellow = "";
var svg_bin_red    = "";
var svg_bin_leak   = "";


$(document).ready(function(){
    ons.ready(function(){
        // Onsen UI events.

        // Navigation bar.
        document.addEventListener("prechange", function(event){
            let tab_label = event.tabItem.getAttribute("label");

            if (tab_label === "Data Analytics") {
                if (init_data_analytics_done === false) {
                    init_data_analytics();
                }
                get_analytics();
            } else if (tab_label === "Settings") {
                get_controller_platform();
            }
        });
        // End of Navigation bar.

        init_dashboard();

        // BinInfo pull to refresh.
        let refresh_hook_dashboard = document.getElementById("dashboard_refresh");
        refresh_hook_dashboard.addEventListener("changestate", function(event){
            let message = "Pull to refresh";

            if (event.state === "action") {
                message = "<ons-progress-circular indeterminate></ons-progress-circular>";
            }

            refresh_hook_dashboard.innerHTML = message;
        });

        refresh_hook_dashboard.onAction = function(done){
            get_all_smartbins();
            setTimeout(done, 500);
        }
        // End of BinInfo pull to refresh.

        // Auto refresh switch.
        $(document).on("change", "#AutoRefreshSwitch", function(){
            if ($("#AutoRefreshSwitch")[0].checked === true) {
                ons.notification.toast("Auto-Refresh enabled.", {
                    animation: "fall",
                    timeout: 3000,
                    buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
                });
                auto_refresh = true;
                auto_refresh_dashboard();
            } else {
                ons.notification.toast("Auto-Refresh disabled. Pull page down to manually refresh data.", {
                    animation: "fall",
                    timeout: 3000,
                    buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
                });
                auto_refresh = false;
            }
        });
        // End of auto refresh switch.

        // Dark mode switch.
        $(document).on("change", "#DarkModeSwitch", function(){
            if ($("#DarkModeSwitch")[0].checked === true) {
                $("#theme").attr("href", "/static/css/dark-onsen-css-components.min.css");
            } else {
                $("#theme").attr("href", "/static/css/onsen-css-components.min.css");
            }
        });
        // End of dark mode switch.

        // Routine SmartBin dashboard information updater.
        auto_refresh_dashboard();
    });
});

function init_dashboard() {
    const SVG_ICONS = [{
        name: "bin_empty.svg",
        class: "svg-bin-empty"
    }, {
        name: "bin_green.svg",
        class: "svg-bin-green"
    }, {
        name: "bin_yellow.svg",
        class: "svg-bin-yellow"
    }, {
        name: "bin_red.svg",
        class: "svg-bin-red"
    }, {
        name: "bin_leak.svg",
        class: "svg-bin-leak"
    }];

    for (let i = 0; i < SVG_ICONS.length; i++) {
        $.ajax({
            url: "/static/img/svg/" + SVG_ICONS[i].name,
            type: "GET",
            dataType: "html",
            success: function(response){
                switch (SVG_ICONS[i].class) {
                    case "svg-bin-empty":
                        svg_bin_empty = String(response);
                        break;
                    case "svg-bin-green":
                        svg_bin_green = String(response);
                        break;
                    case "svg-bin-yellow":
                        svg_bin_yellow = String(response);
                        break;
                    case "svg-bin-red":
                        svg_bin_red = String(response);
                        break;
                    case "svg-bin-leak":
                        svg_bin_leak = String(response);
                        break;
                }
            },
            error: function(response){
                error_message = "Failed to load SmartBin Controller assets.";

                ons.notification.toast(error_message, {
                    animation: "fall",
                    timeout: 3000,
                    buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
                });
            }
        });
    }
}


function init_data_analytics() {
    // DataAnalytics pull to refresh.
    let refresh_hook_data = document.getElementById("data_refresh");
    refresh_hook_data.addEventListener("changestate", function(event){
        let message = "Pull to refresh";

        if (event.state === "action") {
            message = "<ons-progress-circular indeterminate></ons-progress-circular>";
        }

        refresh_hook_data.innerHTML = message;
    });

    refresh_hook_data.onAction = function(done){
        get_analytics();
        setTimeout(done, 500);
    }
    // End of DataAnalytics pull to refresh.

    init_data_analytics_done = true;
}


function get_controller_platform() {
    let controller_platform = "Desktop";
    let controller_renderer = "App";

    if (ons.platform.isIPad() === true) {
        controller_platform = "iPadOS";
    } else if (ons.platform.isIOS() === true) {
        controller_platform = "iOS";
    } else if (ons.platform.isAndroid() === true) {
        controller_platform = "Android";
    }

    if (ons.platform.isSafari() === true) {
        controller_renderer = "Safari";
    } else if (ons.platform.isFirefox() === true) {
        controller_renderer = "Firefox";
    } else if (ons.platform.isChrome() === true) {
        controller_renderer = "Chromium";
    } else if (ons.platform.isEdge() === true) {
        controller_renderer = "Microsoft Edge";
    }

    $("#settings_controller_platform").text(controller_platform + " (" + controller_renderer + ")");
}


function auto_refresh_dashboard() {
    if (auto_refresh === true) {
        get_all_smartbins();
        setTimeout(auto_refresh_dashboard, POLL_INTERVAL);
    }
}


function get_all_smartbins() {
    /*
     * GET /trashbins/all HTTP/1.1
     *
     * Expects a JSON response, with `message` containing a string and
     * `result` containing an array of `smartbin` JSON objects.
    */
    $.ajax({
        url: "/trashbins/all",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            let result = response.result;
            let new_row = $("#js_SmartBinRow").contents().clone();
            $("#HomeContent").empty();
            $("#HomeContent").append(new_row);

            if (result.length === 0) {
                // No results received.
                $("#empty_dashboard").show();
            } else {
                $("#empty_dashboard").hide();

                for (let i = 0; i < result.length; i++) {
                    add_smartbin(result[i]);
                }
            }
        },
        error: function(response){
            if (response.status !== 404) {
                error_message = "Failed to retrieve SmartBin information.";

                if (response.responseJSON !== undefined) {
                    if (typeof response.responseJSON.message === "string") {
                        error_message = response.responseJSON.message;
                    }
                }

                ons.notification.toast(error_message, {
                    animation: "fall",
                    timeout: 3000,
                    buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
                });
            }
        }
    });
}


function add_smartbin(smartbin) {
    /*
     * JSON structure of `smartbin`:
     * {
     *   bin_id: str (MAC address of the SmartBin WiFi module, used to uniquely identify SmartBins),
     *   name: str (Description containing the friendly name of the SmartBin),
     *   location: str (Description containing the location of the SmartBin),
     *   capacity: int (An integer representing the percentage of how filled the SmartBin is),
     *   liquid_detected: bool (True if liquid is detected in SmartBin),
     *   last_cleared: str (Description containing the last moment this SmartBin was cleared e.g. '5 minutes ago'),
     *   last_activity: str (Description containing the last moment logs were received from this SmartBin e.g. '5 minutes ago')
     * }
    */
    // Generate the SmartBin information card,
    let bininfo = $("#js_SmartBinCard").contents().clone();
    
    bininfo.attr("id", smartbin.bin_id);
    bininfo.find("ons-card").attr("onclick", "smartbin_action_card('" + smartbin.name + "', '" + smartbin.bin_id + "');");
    bininfo.find("#bin_name").text(smartbin.name);
    bininfo.find("#bin_location").text(smartbin.location);
    bininfo.find("#bin_capacity").text(smartbin.capacity + "%");
    bininfo.find("#bin_lastcleared").text(smartbin.last_cleared);
    bininfo.find("#bin_lastactivity").text(smartbin.last_activity);

    if (smartbin.capacity < 5) {
        bininfo.find("#bin_capacity_icon").html(svg_bin_empty);
    } else if (smartbin.capacity < 45) {
        bininfo.find("#bin_capacity_icon").html(svg_bin_green);
    } else if (smartbin.capacity < 80) {
        bininfo.find("#bin_capacity_icon").html(svg_bin_yellow);
    } else {
        bininfo.find("#bin_capacity_icon").html(svg_bin_red);
    }

    if (smartbin.liquid_detected === true) {
        bininfo.find("#bin_leakage_icon").html(svg_bin_leak);
    } else {
        // No leakage detected. Remove the Bin Leakage icon.
        bininfo.find("#bin_leakage_icon").empty();
    }

    if (smartbin.last_activity === "Recently") {
        bininfo.find("#bin_lastactivity_icon").attr("icon", "md-portable-wifi");
    } else {
        bininfo.find("#bin_lastactivity_icon").attr("icon", "md-portable-wifi-off");
    }

    if (smartbin.capacity >= 80 || smartbin.liquid_detected === true) {
        bininfo.find("#bin_name").append("<span class='notification'>!</span>");
    }

    // Get the last available row to add the SmartBin information card.
    let last_row = $(".smartbin-row").last();
    if (last_row.find(".smartbin-col").length === 3) {
        // Last row already has 3 cards, create new row.
        let row = $("#js_SmartBinRow").contents().clone();
        row.insertAfter(last_row);
        // Select the newly created row.
        last_row = $(".smartbin-row").last();
    }

    // Add the SmartBin information card to the last row.
    last_row.append(bininfo);
}


function smartbin_action_card(bin_name, bin_id) {
    /*
     * Action card that will appear when a SmartBin information card is tapped/clicked.
    */
    let bininfo = $("#" + bin_id);

    /*
     * 4 Options: Rename SmartBin, Change Location, Remove SmartBin, Cancel
    */
    ons.openActionSheet({
        title: bin_name + " (SmartBin ID: " + bin_id + ")",
        cancelable: true,
        buttons: [
            "Rename SmartBin",
            "Change Location",
            {label: "Remove SmartBin", modifier: "destructive"},
            {label: "Cancel", icon: "md-close"}
        ]
    }).then(function(choice){
        if (choice === 0) {
            // Rename SmartBin selected.

            ons.notification.prompt({
                title: "Rename SmartBin",
                message: "Enter the new name below.",
                cancelable: true
            }).then(function(user_input){
                if (user_input !== null) {
                    let new_name = user_input.trim();

                    if (new_name.length === 0) {
                        // Blank user input provided.
                        ons.notification.alert({
                            title: "Failed to update SmartBin name",
                            message: "SmartBin name cannot be left empty."
                        });
                    } else {
                        /*
                         * POST /trashbins/get/<bin_id> HTTP/1.1
                         * Content-Type: application/json
                         *
                         * {
                         *   "action": "update_name",
                         *   "name": new_name
                         * }
                        */
                        $.ajax({
                            url: "/trashbins/get/" + bin_id,
                            type: "POST",
                            dataType: "JSON",
                            contentType: "application/json",
                            data: JSON.stringify({
                                action: "update_name",
                                name: new_name
                            }),
                            success: function(response){
                                bininfo.find("#bin_name").text(new_name);
                                bininfo.find("ons-card").attr("onclick", "bininfo_action('" + new_name + "', '" + bin_id + "');");

                                ons.notification.toast("SmartBin (ID: " + bin_id + ") name updated.", {
                                    animation: "fall",
                                    timeout: 3000,
                                    buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
                                });
                            },
                            error: function(response){
                                error_message = "The Controller has encountered an error.";

                                if (response.responseJSON !== undefined) {
                                    if (typeof response.responseJSON.message === "string") {
                                        error_message = response.responseJSON.message;
                                    }
                                }

                                ons.notification.alert({
                                    title: "Failed to update SmartBin name",
                                    message: error_message
                                });
                            }
                        });
                    }
                }
            });
        } else if (choice === 1) {
            // Change Location selected.

            ons.notification.prompt({
                title: "Change Location",
                message: "Enter the new location below.",
                cancelable: true
            }).then(function(user_input){
                if (user_input !== null) {
                    let new_location = user_input.trim();

                    if (new_location.length === 0) {
                        // Blank user input provided.
                        ons.notification.alert({
                            title: "Failed to change SmartBin location",
                            message: "SmartBin location cannot be left empty."
                        });
                    } else {
                        /*
                         * POST /trashbins/get/<bin_id> HTTP/1.1
                         * Content-Type: application/json
                         *
                         * {
                         *   "action": "update_location",   
                         *   "location": new_location
                         * }
                        */
                        $.ajax({
                            url: "/trashbins/get/" + bin_id,
                            type: "POST",
                            dataType: "JSON",
                            contentType: "application/json",
                            data: JSON.stringify({
                                action: "update_location",
                                location: new_location
                            }),
                            success: function(response){
                                bininfo.find("#bin_location").text(new_location);

                                ons.notification.toast("SmartBin (ID: " + bin_id + ") location updated.", {
                                    animation: "fall",
                                    timeout: 3000,
                                    buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
                                });
                            },
                            error: function(response){
                                error_message = "The Controller has encountered an error.";

                                if (response.responseJSON !== undefined) {
                                    if (typeof response.responseJSON.message === "string") {
                                        error_message = response.responseJSON.message;
                                    }
                                }

                                ons.notification.alert({
                                    title: "Failed to update SmartBin name",
                                    message: error_message
                                });
                            }
                        });
                    }
                }
            });
        } else if (choice === 2) {
            // Remove SmartBin selected.
            // Since this is a destructive action, lets confirm with the user again.
            ons.notification.confirm({
                title: "Remove " + bin_name,
                message: "Are you sure you wish to remove this SmartBin? This cannot be undone."
            }).then(function(action){
                if (action === 1) {
                    // OK was pressed.
                    if (bininfo.find("#bin_lastactivity").text() === "Recently") {
                        ons.notification.alert({
                            title: "Failed to remove SmartBin",
                            message: "SmartBin is still connected. Disconnect it from the Controller before removing (You may need to wait for up to 30 seconds)."
                        });
                    } else {
                        /*
                         * DELETE /trashbins/get/<bin_id> HTTP/1.1
                        */
                        $.ajax({
                            url: "/trashbins/get/" + bin_id,
                            type: "DELETE",
                            dataType: "JSON",
                            success: function(response){
                                get_all_smartbins();

                                ons.notification.toast("SmartBin (ID: " + bin_id + ") removed.", {
                                    animation: "fall",
                                    timeout: 3000,
                                    buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
                                });
                            },
                            error: function(response){
                                error_message = "The Controller has encountered an error.";

                                if (response.responseJSON !== undefined) {
                                    if (typeof response.responseJSON.message === "string") {
                                        error_message = response.responseJSON.message;
                                    }
                                }

                                ons.notification.alert({
                                    title: "Failed to remove SmartBin",
                                    message: error_message
                                });
                            }
                        });
                    }
                }
            });
        }
    });
}


/* Data Analytics functions */
function get_analytics() {
    // Number counts
    count_leaking_smartbins();
    count_capacity_alerts();
    count_smartbin_locations();
    count_total_smartbins();

    // Charts
    chart_leakage_analytics();
    chart_capacity_analytics();
    chart_clear_count();
    chart_location_distribution();
}


function get_random_chart_colour(alpha = "0.4") {
    /* Allows us to generate random colours for our charts. */
    let colour = "hsla(" + (Math.random() * 360) + ", 70%, 50%, ";
    let background = colour + alpha + ")";
    let border = colour + "1)";
    return [background, border];
}


function generate_stacked_line_chart(canvas_element_id, chart_title, chart_labels, chart_datasets) {
    let ctx = document.getElementById(canvas_element_id).getContext("2d");

    let stacked_line_chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chart_labels,
            datasets: chart_datasets
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: chart_title
            },
            legend: {
                display: true
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function(value){
                            if (Number.isInteger(value)){
                                return value;
                            }
                        }
                    }
                }], xAxes: [{
                    stacked: true,
                }]
            }
        }
    });
}


function chart_leakage_analytics() {
    $.ajax({
        url: "/trashbins/data/chart_leakages_7_days",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            let index = 0;
            let datasets = [];
            let result = response.result;

            for (let key in result.locations) {
                if (index > CHART_BACKGROUND.length) {
                    colour_picker = get_random_chart_colour();
                    background_colour = colour_picker[0];
                    border_colour = colour_picker[1];
                } else {
                    background_colour = CHART_BACKGROUND[index];
                    border_colour = CHART_BORDER[index];
                    index++;
                }

                datasets.push({
                    label: key,
                    fill: true,
                    backgroundColor: background_colour,
                    borderColor: border_colour,
                    borderCapStyle: "butt",
                    data: result.locations[key]
                });
                index++;
            }

            generate_stacked_line_chart(
                "chart_leakage_detection", "Liquid Leakage Alerts Count by Location (Past 7 Days)", result.labels, datasets
            );
        },
        error: function(response){
            error_message = "The Controller has encountered an error.";

            if (response.responseJSON !== undefined) {
                if (typeof response.responseJSON.message === "string") {
                    error_message = response.responseJSON.message;
                }
            }

            ons.notification.toast(error_message, {
                animation: "fall",
                timeout: 3000,
                buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
            });
        }
    });
}


function chart_capacity_analytics() {
    $.ajax({
        url: "/trashbins/data/chart_capacity_7_days",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            let index = 0;
            let datasets = [];
            let result = response.result;

            for (let key in result.locations) {
                if (index > CHART_BACKGROUND.length) {
                    colour_picker = get_random_chart_colour();
                    background_colour = colour_picker[0];
                    border_colour = colour_picker[1];
                } else {
                    background_colour = CHART_BACKGROUND[index];
                    border_colour = CHART_BORDER[index];
                    index++;
                }

                datasets.push({
                    label: key,
                    fill: true,
                    backgroundColor: background_colour,
                    borderColor: border_colour,
                    borderCapStyle: "butt",
                    data: result.locations[key]
                });
            }

            generate_stacked_line_chart(
                "chart_capacity_alerts", "Capacity Alerts Count by Location (Past 7 Days)", result.labels, datasets
            );
        },
        error: function(response){
            error_message = "The Controller has encountered an error.";

            if (response.responseJSON !== undefined) {
                if (typeof response.responseJSON.message === "string") {
                    error_message = response.responseJSON.message;
                }
            }

            ons.notification.toast(error_message, {
                animation: "fall",
                timeout: 3000,
                buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
            });
        }
    });
}


function chart_clear_count() {
    $.ajax({
        url: "/trashbins/data/chart_clearcount_7_days",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            let index = 0;
            let datasets = [];
            let result = response.result;

            for (let key in result.locations) {
                if (index > CHART_BACKGROUND.length) {
                    colour_picker = get_random_chart_colour();
                    background_colour = colour_picker[0];
                    border_colour = colour_picker[1];
                } else {
                    background_colour = CHART_BACKGROUND[index];
                    border_colour = CHART_BORDER[index];
                    index++;
                }

                datasets.push({
                    label: key,
                    fill: true,
                    backgroundColor: background_colour,
                    borderColor: border_colour,
                    borderCapStyle: "butt",
                    data: result.locations[key]
                });
                index++;
            }

            generate_stacked_line_chart(
                "chart_clear_count", "SmartBin Clearing Count by Day (Past 7 Days)", result.labels, datasets
            );
        },
        error: function(response){
            error_message = "The Controller has encountered an error.";

            if (response.responseJSON !== undefined) {
                if (typeof response.responseJSON.message === "string") {
                    error_message = response.responseJSON.message;
                }
            }

            ons.notification.toast(error_message, {
                animation: "fall",
                timeout: 3000,
                buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
            });
        }
    });
}


function chart_location_distribution() {
    $.ajax({
        url: "/trashbins/data/chart_location_distribution",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            let index = 0;
            let labels = [];
            let dataset = [];
            let background_colours = [];
            let border_colours = [];
            let result = response.result;

            for (let key in result) {
                if (index > PIECHART_COLOUR.length) {
                    colour_picker = get_random_chart_colour("0.8");
                    background_colours.push(colour_picker[0]);
                } else {
                    background_colours.push(PIECHART_COLOUR[index]);
                    index++;
                }
                
                border_colours.push("rgba(239, 239, 244, 1)");
                labels.push(key);
                dataset.push(result[key]);
            }

            let ctx = document.getElementById("chart_location_distribution").getContext("2d");
            let analytics_chart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [{
                        backgroundColor: background_colours,
                        borderColor: border_colours,
                        data: dataset
                    }]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: "SmartBin Location Distribution"
                    },
                    legend: {
                        display: true
                    },
                }
            });
        },
        error: function(response){
            error_message = "The Controller has encountered an error.";

            if (response.responseJSON !== undefined) {
                if (typeof response.responseJSON.message === "string") {
                    error_message = response.responseJSON.message;
                }
            }

            ons.notification.toast(error_message, {
                animation: "fall",
                timeout: 3000,
                buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
            });
        }
    });
}


function count_leaking_smartbins() {
    $.ajax({
        url: "/trashbins/data/count_leaking_smartbin",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            $("#data_count_leaking_smartbin").text(response.result);
        },
        error: function(response){
            error_message = "The Controller has encountered an error.";

            if (response.responseJSON !== undefined) {
                if (typeof response.responseJSON.message === "string") {
                    error_message = response.responseJSON.message;
                }
            }

            ons.notification.toast(error_message, {
                animation: "fall",
                timeout: 3000,
                buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
            });
        }
    });
}


function count_capacity_alerts() {
    $.ajax({
        url: "/trashbins/data/count_capacity_alerts",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            $("#data_count_capacity_alerts").text(response.result);
        },
        error: function(response){
            error_message = "The Controller has encountered an error.";

            if (response.responseJSON !== undefined) {
                if (typeof response.responseJSON.message === "string") {
                    error_message = response.responseJSON.message;
                }
            }

            ons.notification.toast(error_message, {
                animation: "fall",
                timeout: 3000,
                buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
            });
        }
    });
}


function count_smartbin_locations() {
    $.ajax({
        url: "/trashbins/data/count_location",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            $("#data_count_location").text(response.result);
        },
        error: function(response){
            error_message = "The Controller has encountered an error.";

            if (response.responseJSON !== undefined) {
                if (typeof response.responseJSON.message === "string") {
                    error_message = response.responseJSON.message;
                }
            }

            ons.notification.toast(error_message, {
                animation: "fall",
                timeout: 3000,
                buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
            });
        }
    });
}


function count_total_smartbins() {
    $.ajax({
        url: "/trashbins/data/count_smartbins",
        type: "GET",
        dataType: "JSON",
        success: function(response){
            $("#data_count_smartbins").text(response.result);
        },
        error: function(response){
            error_message = "The Controller has encountered an error.";

            if (response.responseJSON !== undefined) {
                if (typeof response.responseJSON.message === "string") {
                    error_message = response.responseJSON.message;
                }
            }

            ons.notification.toast(error_message, {
                animation: "fall",
                timeout: 3000,
                buttonLabel: "<ons-icon icon='md-close-circle-o'></ons-icon>"
            });
        }
    });
}
