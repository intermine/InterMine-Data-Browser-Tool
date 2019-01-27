window.onload = function() {
    //hidePreloader();
}

$(document).ready(function() {

    if(!sessionStorage.getItem('currentClassView')) {
        sessionStorage.setItem('currentClassView', 'Gene');
    }

    var currentClassView = sessionStorage.getItem('currentClassView');

    checkForHTTPS();
    initializeViewButtons();
    handleResponsiveness();
    handleCurrentClassFilter(currentClassView);

    document.title = currentClassView + " in HumanMine";
    $("#proteinsButton").removeClass("btn-primary").addClass("btn-default");
    $("#genesButton").removeClass("btn-default").addClass("btn-primary");
    var mineUrl = window.mineUrl.replace(/COLON/g, ":").replace(/SLASH/g, "/");

    // Instantiate the im-table with all the data available in Gene from HumanMine
    var selector = '#dataTable';
    var service = {
        root: mineUrl,
        token: getSessionToken()
    };
    var query = {
        select: ['*'],
        //select: ['*','goAnnotation.ontologyTerm.name','pathways.name'],
        from: currentClassView
    };

    imtables.configure({
        TableCell: {
            PreviewTrigger: 'click'
        }
    });

    imtables.configure('TableResults.CacheFactor', 20);

    var imtable = imtables.loadDash(
        selector, {
            "start": 0,
            "size": 25
        }, {
            service: service,
            query: query
        }
    ).then(
        function(table) {
            table.children.table.on("rendered", function(changeDetail) {
                hidePreloader();
                document.title = sessionStorage.getItem('currentClassView') + " in " + window.selectedMineName;
                updateElements(table.history.currentQuery.constraints, "PieChart");
                updateGeneLengthChart(table.history.currentQuery.constraints, "GeneLengthChart");
            });

            window.imTable = table.children.table;
        },
        function(error) {
            console.error('Could not load table', error);
        }
    );
});

/**
 * Method that dynamically adds a IN, NOT IN and LOOKUP filter based on the current class to the left sidebar
 * @param {string} currentClassView: the current class being viewed
 */
function handleCurrentClassFilter(currentClassView) {
    // Add the element to the sidebar
    $("#sidebarUl").prepend(
        '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="' + currentClassView + '" id="' + currentClassView + 'FilterLi"><a class="nav-link" data-toggle="collapse" href="#'+ currentClassView + 'SearchCardBlock" aria-controls="' + currentClassView + 'SearchCardBlock" style="color:black;"><i class="fa fa-fw fa-eye"></i><span class="nav-link-text"></span>' + currentClassView + '</a><div class="card" style="width: 100%;"><div class="collapse card-block" id="' + currentClassView + 'SearchCardBlock" style="overflow: auto;"><div class="ul list-group list-group-flush" id="' + currentClassView + 'FilterList"></div><form-group class="ui-front"><input class="form-control" type="text" id="' + currentClassView + 'SearchInput" placeholder="Search input..."/><select class="form-control" id="' + currentClassView + 'SearchTypeSelector" style="width: 100%;"><option value="LOOKUP">LOOKUP identifier(s)</option><option value="IN">IN list</option><option value="NOTIN">NOT IN list</option></select><button class="btn btn-success" type="button" style="width:100%;" id="' + currentClassView + 'SearchButton">Go!</button><button class="btn btn-secondary" type="button" style="width:100%;" id="' + currentClassView + 'ResetButton">Reset</button></form-group></div></div></li>');

    // Handle the events
    $('#' + currentClassView + 'SearchButton').click(function() {
        showPreloader();
        if (window.currentClassViewFilter) clearCurrentClassViewConstraint();

		var currentClassViewInput = $('#' + currentClassView + 'SearchInput').val();
        var currentClassViewSearchType = $('#' + currentClassView + 'SearchTypeSelector').val();

		window.currentClassViewFilter = [];
        
        // Any input given?
		if(currentClassViewInput) {
            // LOOKUP, IN or NOTIN ?
            if(currentClassViewSearchType === "LOOKUP") {
                window.imTable.query.addConstraint({
                    "path": currentClassView,
                    "op": "LOOKUP",
                    "value": currentClassViewInput,
                    "extraValue": ""
                });
    
                window.currentClassViewFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
            }

            if(currentClassViewSearchType === "IN") {
                window.imTable.query.addConstraint({
                    "path": currentClassView,
                    "op": "IN",
                    "value": currentClassViewInput
                });
    
                window.currentClassViewFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
            }

            if(currentClassViewSearchType === "NOTIN") {
                window.imTable.query.addConstraint({
                    "path": currentClassView,
                    "op": "NOT IN",
                    "value": currentClassViewInput
                });
    
                window.currentClassViewFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
            }
		}
    });

    $('#' + currentClassView + 'ResetButton').click(function() {
        if (window.currentClassViewFilter) clearCurrentClassViewConstraint();
        $("#" + currentClassView + "SearchInput").val('');
    });
}

/**
 * This method initializes the default view buttons and adds others depending on the mine and user-specific configuration
 */
function initializeViewButtons() {
    var currentClassView = sessionStorage.getItem('currentClassView');
    var defaultViews = ['Gene','Protein'];

    // Add default views
    for (var i = 0; i < defaultViews.length; i++) {
        if(currentClassView === defaultViews[i]) {
            $("#headerButtons").append(
                '<a href="#" data-toggle="tooltip" title="Change to ' + defaultViews[i] + ' view"><button class="btn btn-primary btn-space" id="' + defaultViews[i] + 'Button" type="button">' + defaultViews[i] + '</button></a>');
        } else {
            $("#headerButtons").append(
                '<a href="#" data-toggle="tooltip" title="Change to ' + defaultViews[i] + ' view"><button class="btn btn-default btn-space" id="' + defaultViews[i] + 'Button" type="button">' + defaultViews[i] + '</button></a>');
        }

        $('#' + defaultViews[i] + 'Button').click(function(event) {
            sessionStorage.setItem('currentClassView', String(this.id).split('Button')[0]);
            location.reload();
        });
    }

    // Add classes with preferredBagType tag for the current mine
    var mineURL = escapeMineURL(window.mineUrl);

    if(mineURL.slice(-1) != "/") {
        mineURL += "/";
    }

    mineURL += "model?format=json";

    $.when(getMineModel(mineURL)).done(function(result) {
        var mineClasses = JSON.parse(JSON.stringify(result.model.classes));
        var mineClassesArray = [];
        for(var x in mineClasses){
            mineClassesArray.push(mineClasses[x]);
        }

        for (var i = 0; i < mineClassesArray.length; i++) {
            if(mineClassesArray[i].tags.includes("im:preferredBagType") && !defaultViews.includes(mineClassesArray[i].name)) {
                if(currentClassView === mineClassesArray[i].name) {
                    $("#headerButtons").append(
                        '<a href="#" data-toggle="tooltip" title="Change to ' + mineClassesArray[i].name + ' view"><button class="btn btn-primary btn-space" id="' + mineClassesArray[i].name + 'Button" type="button">' + mineClassesArray[i].name + '</button></a>');    
                } else {
                    $("#headerButtons").append(
                        '<a href="#" data-toggle="tooltip" title="Change to ' + mineClassesArray[i].name + ' view"><button class="btn btn-default btn-space" id="' + mineClassesArray[i].name + 'Button" type="button">' + mineClassesArray[i].name + '</button></a>');    
                }

                $('#' + mineClassesArray[i].name + 'Button').click(function(event) {
                    sessionStorage.setItem('currentClassView', String(this.id).split('Button')[0]);
                    location.reload();
                });
            }
        }
    });

    // Add custom views
    if (!localStorage.getItem("view-manager")) {
        localStorage.setItem("view-manager", "[]");
    }
    
    var currentViewManagerObject = JSON.parse(localStorage.getItem("view-manager"));
    if(findElementJSONarray(currentViewManagerObject, "mine", window.selectedMineName)) {
        var currentMineViewManagerSettings = findElementJSONarray(currentViewManagerObject, "mine", window.selectedMineName);
        if(currentMineViewManagerSettings.viewNames) {
            var currentMineAndViewSettingsValues = currentMineViewManagerSettings.viewNames.split(",");
            for (var i = 0; i < currentMineAndViewSettingsValues.length; i++) {
                // Add the HTML
                if(currentClassView === currentMineAndViewSettingsValues[i]) {
                    $("#headerButtons").append(
                        '<a href="#" data-toggle="tooltip" title="Change to ' + currentMineAndViewSettingsValues[i] + ' view"><button class="btn btn-primary btn-space" id="' + currentMineAndViewSettingsValues[i] + 'Button" type="button">' + currentMineAndViewSettingsValues[i] + '</button></a>');    
                } else {
                    $("#headerButtons").append(
                        '<a href="#" data-toggle="tooltip" title="Change to ' + currentMineAndViewSettingsValues[i] + ' view"><button class="btn btn-default btn-space" id="' + currentMineAndViewSettingsValues[i] + 'Button" type="button">' + currentMineAndViewSettingsValues[i] + '</button></a>');    
                }

                $('#' + currentMineAndViewSettingsValues[i] + 'Button').click(function(event) {
                    sessionStorage.setItem('currentClassView', String(this.id).split('Button')[0]);
                    location.reload();
                });
            }
        }
    }
}

/**
 * This method checks if there has been any window resize event to change the navbar padding accordingly
 */
function handleResponsiveness() {
    var width = $(window).width();

    // Initial sizing
    if (width < 992) {
        var navbarHeight = $("#navbarResponsive").height();
        if (width < 770) {
            $("body.fixed-nav").css("padding-top", navbarHeight + 75);
        } else {
            $("body.fixed-nav").css("padding-top", navbarHeight + 56);
        }
    } else {
        $("body.fixed-nav").css("padding-top", "56px");
    }

    // Event handling
    $(window).on('resize', function() {
        if ($(this).width() != width) {
            width = $(this).width();
            // Regular device
            if (width < 992) {
                var navbarHeight = $("#navbarResponsive").height();
                if (width < 770) {
                    $("body.fixed-nav").css("padding-top", navbarHeight + 75);
                } else {
                    $("body.fixed-nav").css("padding-top", navbarHeight + 56);
                }
            }
            // Small device
            else {
                $("body.fixed-nav").css("padding-top", "56px");
            }
        }
    });
}

/**
 * This method removes any constraint that has been applied to the current class view filter
 */
function clearCurrentClassViewConstraint() {
	for(var i = 0; i < window.currentClassViewFilter.length; i++) {
        try {
            window.imTable.query.removeConstraint(window.currentClassViewFilter[i]);
        }
        catch(err) {
            continue;
        }
	}
    window.currentClassViewFilter = null;
}

/**
 * This method checks if the user is using HTTPS protocol to access the browser in order to show an informative warning
 */
function checkForHTTPS() {
    if (window.location.protocol.includes("https")) {
        $("#navbarResponsive").prepend("<div class='alert' id='httpsAlert'>You are currently viewing the HTTPS website. Due to security limitations, we are unable to show results from HTTP-only InterMines. You may be able to see more results if you <a href='http://im-browser-prototype.herokuapp.com/'>reload this site</a> via HTTP, and/or allow unsafe scripts to run.</div><br/>");
    }
}

/**
 * A function that will Hide the Preloader
 */

function hidePreloader() {
    $("#preloader").fadeOut();
    // $("nav").css("display", "flex");
    // $(".content-wrapper").css("display", "block");
}

/**
 * A function that will Show the Preloader
 */

function showPreloader() {
    $("#preloader").fadeIn();
    // $("nav").css("display", "none");
    // $(".content-wrapper").css("display", "none");
}