$(document).ready(function() {
    initializeStartupConfiguration();
});

/**
 * This method initialies the global variables used for the filters, reads the JSON filters config
 * and handles the default mine view.
 */
function initializeStartupConfiguration() {
    window.imTableConstraint = {
        "goAnnotation" : [],
        "datasetName" : [],
        "pathwayName" : [],
        "proteinDomainName" : [],
        "diseaseName" : [],
        "organism" : [],
        "savedList": null
    }; // 0 = GO annotation, 1 = Dataset Name, 2 = Pathway Name, 3 = Protein Domain Name, 4 = Disease Name

    window.interminesHashMap = null;
    window.locationFilter = null;
    window.interactionsFilter = null;
    window.clinVarFilter = null;
    window.expressionFilter = null;
    window.organismFilterLetters = ["A","B","C","D","E","F","G","H","I","J"];
    window.organismFilter = null;
    window.organismColorsMap = {}
    window.proteinLocalisationFilter = null;
    window.currentClassViewFilter = null;
    window.pieChartObject = null;
    window.geneLengthChartObject = null;

    window.minesConfigs = null;
    window.minesPreferredOrganisms = null;

    readTextFile("./mine_configs/mines_config.json", function(text) {
        window.minesConfigs = JSON.parse(text);
    });

    readTextFile("./mine_configs/mines_preferred_organisms.json", function(text) {
        window.minesPreferredOrganisms = JSON.parse(text);
    });

    // Initial mine service url (HumanMine), name and view
    window.mineUrl = "httpsCOLONSLASHSLASHwww.humanmine.orgSLASHhumanmineSLASHservice";
    window.selectedMineName = "HumanMine";
    if(!sessionStorage.getItem('currentClassView')) {
        sessionStorage.setItem('currentClassView', 'Gene');
    }

    // Check if there is a saved mine in LocalStorage
    if (typeof(Storage) !== "undefined") {
        if (localStorage.getItem("selectedMineName") && localStorage.getItem("mineUrl")) {
            window.mineUrl = localStorage.getItem("mineUrl");
            window.selectedMineName = localStorage.getItem("selectedMineName");
        }
    }

    // Handle the API Keys manager buttons
    $("#apiKeyManagerButton").click(function() {
        // Update the key manager structures
        initializeKeyManager();

        // Show the window
        $('#apiKeyManagerModal').appendTo("body").modal('show');
    });

    $("#apiKeyManagerSaveButton").click(function() {
        var newApiKeysObject = [];

        var anyError = false; // We will use this variable to check for errors
        
        // Iterate through the elements in the div containing the keys and update the LocalStorage object
        $('#apiKeyManagerModalKeysDiv').children('div').each(function () {
            var mineName = $(this).children("label").text();
            var mineAPIkey = $(this).children("input").val();

            // Sanity check: if the API key is valid, we save it, otherwise, warn the user
            if(mineAPIkey != "") {
                $.ajax({
                    url: findElementJSONarray(window.interminesHashMap, "mine", mineName).mineurl + '/user/whoami?token=' + mineAPIkey,
                    type: 'GET',
                    async: false,
                    success: function(data) {
                        newApiKeysObject.push({ "mine" : mineName, "apikey" : mineAPIkey });
                    },
                    error: function(e) {
                        anyError = true;

                        // Show error
                        if ($("#invalidAPIkeyAlert").length == 0) {
                            $("#navbarResponsive").prepend("<div class='alert' id='invalidAPIkeyAlert'><span class='closebtn' id='closeInvalidAPIkeyAlert'>×</span>Error: API key provided for " + mineName + " is not a valid API key - please check you have entered it correctly.</div><br/>");

                            $("#closeInvalidAPIkeyAlert").click(function() {
                                $("#invalidAPIkeyAlert").hide();
                            });
                        } else {
                            $("#invalidAPIkeyAlert").show();
                        }
                    }.bind(this, anyError) // Bind to this environment, so local variable is accesible from inside
                });
            } else {
                newApiKeysObject.push({ "mine" : mineName, "apikey" : mineAPIkey });
            }
        }).promise().done( function(){ 
            if(!anyError) {
                // Save to Local Storage and reload
                localStorage.setItem("api-keys", JSON.stringify(newApiKeysObject));
                location.reload();
            }

            // Hide the window
            $('#apiKeyManagerModal').modal('toggle');
        });
    });

    
    $("#listManagerButton").click(function() {
        initializeSavedLists();
        $("#listManagerModal").modal("show");
    })

    $("#viewConstraintsButton").click(function() {
        initializeConstraintsList();
        $("#constraintsModal").modal("show");
    })

    // Handle the view manager buttons
    $("#viewManagerButton").click(function() {
        // Update the key manager structures
        initializeViewManager();
        
        // Show the window
        $('#viewManagerModal').appendTo("body").modal('show');
    });

    $("#resetAllButton").click(function() {
        location.reload();
    });

    // Update organism short name filter
    try {
        updateOrganismsSidebarFilter();
    } catch (err) {
        console.log("There was an error updating the organism sidebar filter: ", err);
    }
    createSidebarEvents();
}

/**
 * Method to initialize the constraint list from the IM table
 */

function initializeConstraintsList() {
    var tableConstraints = window.imTable.query.constraints;
    if(tableConstraints.length > 0) {
        var listHtml = "";
        for(var i = 0; i < tableConstraints.length; i++) {
            if(tableConstraints[i].value) {
                listHtml += "<li class='list-group-item'>" + tableConstraints[i].path + " " + tableConstraints[i].op + " " + tableConstraints[i].value + "</li>";
            } else {
                listHtml += "<li class='list-group-item'>" + tableConstraints[i].path + " " + tableConstraints[i].op + " " + tableConstraints[i].values + "</li>";
            }
        }
        $('#constraintsModalList').html(listHtml);
    } else {
        $('#constraintsModalList').html("<center>You haven't added any constraint.</center>");
    }
}

/**
 * Method to initialize the saved lists based on the API Keys
 */

function initializeSavedLists(){
    if(window.savedListsInitialized) return;
    getSavedLists().then(function(result) {
        var formElement = '<input class="form-control" id="saved-lists-filter" placeholder="Filter">';
        var listElements = result.map(function(list) {
            return "<li class='list-group-item saved-list-item'>" + list.title + "</li>"
        }).join('');
        $('#savedLists').html(formElement + listElements);
        document.getElementById('listManagerSaveButton').disabled = false;
        document.getElementById('listManagerResetButton').disabled = false;
        $('#saved-lists-filter').on('input', function(e){
            var data = $('#saved-lists-filter')[0].value.toLowerCase().trim();
            $(".saved-list-item").each(function(i, el) {
                if(el.textContent.toLowerCase().indexOf(data) == -1) el.style.display = 'none';
                else el.style.display = 'block';
            });
        });
        $("#listManagerSaveButton").click(function() {
            updateTableWithConstraints();
            $("#listManagerModal").modal("hide");
        });
        $("#listManagerResetButton").click(function() {
            if(window.imTableConstraint['savedList']) {
                window.imTableConstraint['savedList'] = null;
                $('.saved-list-item').each(function(i, el_) {
                    el_.dataset.listConstraintActive = "false";
                    el_.classList.remove('active');
                });
                $("#listManagerModal").modal("hide");
                updateTableWithConstraints();
            }
        });
        $(".saved-list-item").each(function(i, el) { 
            el.addEventListener('click', function() {
                if(el.dataset.listConstraintActive === "true") {
                    el.dataset.listConstraintActive = "false";
                    el.classList.remove('active');
                    window.imTableConstraint["savedList"] = null;
                }
                else {
                    $('.saved-list-item').each(function(i, el_) {
                        el_.dataset.listConstraintActive = "false";
                        el_.classList.remove('active');
                    });
                    el.dataset.listConstraintActive = "true";
                    el.classList.add('active');
                    var listName = el.textContent;
                    window.imTableConstraint['savedList'] = listName;
                }
            });
        });
        window.savedListsInitialized = true;
    })
}

/**
 * Method to update the im-table with the filters selected in the sidebar
 */
function updateTableWithConstraints() {
    while (window.imTable.query.constraints.length > 0) {
        try {
            window.imTable.query.removeConstraint(window.imTable.query.constraints[0]);
        } catch (err) {
            continue;
        }
    }

    // GO Annotation
    if (window.imTableConstraint["goAnnotation"].length > 0) {
        if (sessionStorage.getItem('currentClassView') == "Gene") {
            window.imTable.query.addConstraint({
                "path": "goAnnotation.ontologyTerm.name",
                "op": "ONE OF",
                "values": window.imTableConstraint["goAnnotation"],
                "code": "K"
            });
        } else {
            window.imTable.query.addConstraint({
                "path": "ontologyAnnotations.ontologyTerm.name",
                "op": "ONE OF",
                "values": window.imTableConstraint["goAnnotation"],
                "code": "K"
            });
        }
    }

    // Dataset Name
    if (window.imTableConstraint["datasetName"].length > 0) {
        window.imTable.query.addConstraint({
            "path": "dataSets.name",
            "op": "ONE OF",
            "values": window.imTableConstraint["datasetName"],
            "code": "L"
        });
    }

    // Pathway Name
    if (window.imTableConstraint["pathwayName"].length > 0) {
        window.imTable.query.addConstraint({
            "path": "pathways.name",
            "op": "ONE OF",
            "values": window.imTableConstraint["pathwayName"],
            "code": "M"
        });
    }

    // Protein Domain Name
    if (window.imTableConstraint["proteinDomainName"].length > 0) {
        var filter = window.minesConfigs.filter(function(v){
            return v.mineName===window.selectedMineName;
        })[0].customFilters.filter(function(v){
            return v.filterName==='Protein-Domain';
        });

        var proteinDomainFilterQuery = filter[0].filterQuery[0];
        proteinDomainFilterQuery.values = window.imTableConstraint["proteinDomainName"];

        if (sessionStorage.getItem('currentClassView') == "Gene") {
            window.imTable.query.addConstraint(proteinDomainFilterQuery);
        }
    }

    // Organism
    if (window.imTableConstraint["organism"].length > 0) {
        var organismValues = window.imTableConstraint["organism"];

        for(var i = 0; i < organismValues.length; i++) {
            window.imTable.query.addConstraint({
                "path": "organism.shortName",
                "op": "=",
                "value": organismValues[i],
                "code": window.organismFilterLetters[i]
            });
            window.imTable.query.constraintLogic = window.tableConstraintLogic;
        }
    }

    // Disease Name
    if (window.imTableConstraint["diseaseName"].length > 0) {
        var filter = window.minesConfigs.filter(function(v){
            return v.mineName===window.selectedMineName;
        })[0].customFilters.filter(function(v){
            return v.filterName==='Diseases';
        });

        var diseasesFilterQuery = filter[0].filterQuery[0];
        diseasesFilterQuery.values = window.imTableConstraint["diseaseName"];

        window.imTable.query.addConstraint(diseasesFilterQuery);
        window.imTable.query.constraintLogic = window.tableConstraintLogic;
    }

    // Phenotype Name
    if (window.imTableConstraint["phenotypeName"] && window.imTableConstraint["phenotypeName"].length > 0) {
        var filter = window.minesConfigs.filter(function(v){
            return v.mineName===window.selectedMineName;
        })[0].customFilters.filter(function(v){
            return v.filterName==='Phenotype';
        });

        var phenotypeDomainFilterQuery = filter[0].filterQuery[0];
        phenotypeDomainFilterQuery.values = window.imTableConstraint["phenotypeName"];

        window.imTable.query.addConstraint(phenotypeDomainFilterQuery);
    }

    // List Constraints
    if(window.imTableConstraint['savedList']) {
        window.imTable.query.addConstraint({
            "path": sessionStorage.getItem('currentClassView'),
            "op": "IN",
            "value": window.imTableConstraint["savedList"],
            "code": "N"
        });
    }

    window.imTable.query.constraintLogic = window.tableConstraintLogic;
}


function addViewManagerSelectOptions() {
    // Add classes with preferredBagType tag for the current mine
    var mineURL = escapeMineURL(window.mineUrl);

    if(mineURL.slice(-1) != "/") {
        mineURL += "/";
    }

    mineURL += "model?format=json";
    var url = mineURL;
    
    $.when(getMineModel(url)).done(function(result) {
        var mineClasses = JSON.parse(JSON.stringify(result.model.classes));
        var mineClassesArray = [];
        for(var x in mineClasses) {
            mineClassesArray.push(mineClasses[x]);
        }

        var selectObject = document.getElementById('addViewDropDown');
        var op = "";
        var defaultViews = ['Gene','Protein'];

        for (var i = 0; i < mineClassesArray.length; i++) {
            if(!defaultViews.includes(mineClassesArray[i].name)) {
                op += "<option>" + mineClassesArray[i].name + "</option>";
            }
        }
        selectObject.innerHTML = op;
    }).fail(function(error){
        console.log("error", error);
    })
}
 
/**
 * Method to expand the dataset names filter, showing the remaining ones and adding the appropriate event handling to them
 */
function showMoreDatasetNames() {
    getDatasetNamesInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {
        var availableDatasetNames = [];

        for (var i = 0; i < result.results.length; i++) {
            if (result.results[i]["item"] != null) {
                if (result.results[i]["item"] == "KEGG pathways data set" || result.results[i]["item"] == "HGNC identifiers" || result.results[i]["item"] == "BioGRID interaction data set" || result.results[i]["item"] == "IntAct interactions data set" || result.results[i]["item"] == "ClinVar data set" || result.results[i]["item"] == "OMIM diseases") {
                    continue;
                }
                availableDatasetNames.push({
                    label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                    value: result.results[i]["item"]
                });
            }
        }

        var resultantElementsArray = [];

        for (var i = 0; i < availableDatasetNames.length; i++) {
            resultantElementsArray.push(availableDatasetNames[i]["value"]);
        }

        resultantElementsArray.sort();

        // Remove first 3 elements (already in the sidebar)
        if (resultantElementsArray.length < 4) return;
        resultantElementsArray = resultantElementsArray.slice(3);

        var resultantElementsNumber = resultantElementsArray.length;

        for (var i = 0; i < resultantElementsNumber; i++) {
            var datasetName = resultantElementsArray[i];
            //var datasetCount = "(" + result.results[i]["count"] + ")";
            $("#datasetsSelector").append(
                '<div class="form-check" style="margin-left: 10px;"><input class="form-check-input" type="checkbox" id="' + datasetName.replace(/[^a-zA-Z0-9]/g, '') + '" value="' + datasetName + '"><label class="form-check-label" for="' + datasetName + '"><p>' + datasetName + '</p></label></div>');

            $('#' + datasetName.replace(/[^a-zA-Z0-9]/g, '')).change(function() {
                if ($(this).is(":checked")) {
                    var checkboxValue = $(this).val();
                    window.imTableConstraint["datasetName"].push(checkboxValue);
                } else {
                    var checkboxValue = $(this).val();
                    remove(window.imTableConstraint["datasetName"], checkboxValue);
                }
                updateTableWithConstraints();
            });
        }
    });
}

/**
 * Method to remove the current Custom filters in the sidebar
 */
function clearCustomFilters() {
    $("#locationFilterLi").remove();
    $("#diseasesFilterLi").remove();
    $("#clinvarFilterLi").remove();
    $("#proteinLocalisationFilterLi").remove();
    $("#proteinDomainFilterLi").remove();
    $("#interactionsFilterLi").remove();
    $("#expressionFilterLi").remove();
    $("#datasetFilterLi").remove();
    $("#phenotypeFilterLi").remove();
    window.CustomFiltersAdded = false;
}

function addCustomFilters() {
    if (!window.CustomFiltersAdded) {
        // Read the JSON config file
        if (sessionStorage.getItem('currentClassView') == "Gene") {
            var availableCustomFilters = window.minesConfigs.filter(function(v){
                return v.mineName===window.selectedMineName;
            })[0].customFilters;

            var filter = null;

            // Location filter
            filter = availableCustomFilters.filter(function(v){
                return v.filterName==='Location';
            });

            if (filter.length > 0) {
                $("#sidebarUl").append(
                    '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Location" id="locationFilterLi"><a class="nav-link" data-toggle="collapse" href="#locationSearchCardBlock" aria-controls="locationSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-location-arrow"></i><span class="nav-link-text"></span>Location</a>    <div class="card" style="width: 100%;">        <div class="collapse card-block" id="locationSearchCardBlock" style="overflow-y: auto; overflow-x:hidden;">            <div class="ul list-group list-group-flush" id="locationFilterList"></div>            <form-group class="ui-front">                <div class="row" style="align: center;"><input class="form-control" type="text" id="locationChromosomeSearchInput" placeholder="Chromosome (e.g. 12)" style="width: 100%; float:left; margin-left: 15px;" /></div>                <div class="row" style="align: center;"><input class="form-control" type="text" id="locationStartSearchInput" placeholder="Start" style="width: 45%; float:left; margin-left: 15px;" /><input class="form-control" type="text" id="locationEndSearchInput" placeholder="End" style="width: 45%;"                    /></div><button class="btn btn-success" type="button" style="width:100%;" id="locationSearchButton">Go!</button><button class="btn btn-secondary" type="button" style="width:100%;" id="locationResetButton">Reset</button></form-group>        </div>    </div></li>');
            
                $('#locationSearchButton').click(function() {
                    if (window.locationFilter) clearLocationConstraint();
            
                    var chromosomeInput = $('#locationChromosomeSearchInput').val();
                    var startLocationInput = $('#locationStartSearchInput').val();
                    var endLocationInput = $('#locationEndSearchInput').val();
                    
                    if (!chromosomeInput) {
                        if ($("#locationFilterAlert").length == 0) {
                            $("#navbarResponsive").prepend("<div class='alert' id='locationFilterAlert'><span class='closebtn' id='closeLocationFilterAlert'>×</span>Please, specify a chromosome in the filter input field.</div><br/>");
            
                            $("#closeLocationFilterAlert").click(function() {
                                $("#locationFilterAlert").hide();
                            });
                        } else {
                            $("#locationFilterAlert").show();
                        }
                    }
            
                    if (!$.isNumeric(startLocationInput) || !$.isNumeric(endLocationInput)) {
                        if ($("#locationFilterAlert").length == 0) {
                            $("#navbarResponsive").prepend("<div class='alert' id='locationFilterAlert'><span class='closebtn' id='closeLocationFilterAlert'>×</span>Please, write a integer number in both the 'Start' and 'End' input fields.</div><br/>");
            
                            $("#closeLocationFilterAlert").click(function() {
                                $("#locationFilterAlert").hide();
                            });
                        } else {
                            $("#locationFilterAlert").show();
                        }
            
                        return;
            
                    }
            
                    if (parseInt(startLocationInput) > parseInt(endLocationInput)) {
                        if ($("#locationFilterAlert").length == 0) {
                            $("#navbarResponsive").prepend("<div class='alert' id='locationFilterAlert'><span class='closebtn' id='closeLocationFilterAlert'>×</span>The location start position must be less or equal to the end position.</div><br/>");
            
                            $("#closeLocationFilterAlert").click(function() {
                                $("#locationFilterAlert").hide();
                            });
                        } else {
                            $("#locationFilterAlert").show();
                        }
            
                        return;
                    }
            
                    window.locationFilter = [];

                    var filter = window.minesConfigs.filter(function(v){
                        return v.mineName===window.selectedMineName;
                    })[0].customFilters.filter(function(v){
                        return v.filterName==='Location';
                    });

                    // Format the query
                    var filterQueryLocationsStart = filter[0].filterQuery[0];
                    filterQueryLocationsStart.value = parseInt(startLocationInput);
                    var filterQueryLocationsEnd = filter[0].filterQuery[1];
                    filterQueryLocationsEnd.value = parseInt(endLocationInput);
                    var filterQueryLocatedOn = filter[0].filterQuery[2];
                    filterQueryLocatedOn.value = parseInt(chromosomeInput);

                    // Add the constraints
                    window.imTable.query.addConstraint(filterQueryLocationsStart);            
                    window.locationFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                
                    window.imTable.query.addConstraint(filterQueryLocationsEnd);            
                    window.locationFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                
                    window.imTable.query.addConstraint(filterQueryLocatedOn);            
                    window.locationFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);

                    window.imTable.query.constraintLogic = window.tableConstraintLogic;
                });
            
                $('#locationResetButton').click(function() {
                    if (window.locationFilter) clearLocationConstraint();
                    $("#locationStartSearchInput").val('');
                    $("#locationEndSearchInput").val('');
                    $("#locationChromosomeSearchInput").val('');
                });
            }

            // Expression filter
            filter = availableCustomFilters.filter(function(v){
                return v.filterName==='Expression';
            });

            if (filter.length > 0) {
                $("#sidebarUl").append(
                    '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Expression" id="expressionFilterLi"><a class="nav-link" data-toggle="collapse" href="#expressionSearchCardBlock" aria-controls="expressionSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-tasks"></i><span class="nav-link-text"></span>Expression</a><div class="card" style="width: 100%;"><div class="collapse card-block" id="expressionSearchCardBlock" style="overflow-y: auto; overflow-x:hidden;"><div class="ul list-group list-group-flush" id="expressionFilterList"></div><form-group class="ui-front"><div class="row" style="align: center;"><select class="form-control" id="expressionDatasetSelector" style="width: 100%;"><option value="E-MTAB-62">Dataset: E-MTAB-62</option><option value="E-MTAB-513">Dataset: Illumina bodymap (E-MTAB-513)</option></select></div><div class="row" style="align: center;"><select class="form-control" id="expressionExpressionSelector" style="width: 100%;"><option value="UP">Expression: UP</option><option value="DOWN">Expression: DOWN</option><option value="NONDE">Expression: NONDE</option></select></div><div class="row" style="align: center;"><input class="form-control" type="text" id="expressionPvalueSearchInput" placeholder="P-value (Opt)" style="width: 100%; margin-left: 5px;"/></div><div class="row" style="align: center;"><input class="form-control" type="text" id="expressionTstatisticSearchInput" placeholder="T-statistic (Opt)" style="width: 100%; margin-left: 5px;"/></div><div class="row" style="align: center;"><input class="form-control" type="text" id="expressionTissueSearchInput" placeholder="Tissue (e.g. brain)" style="width: 100%; margin-left: 5px; display:none;"/></div><div class="row" style="align: center;"><input class="form-control" type="text" id="expressionFPKMSearchInput" placeholder="FPKM value (e.g. 0.8)" style="width: 100%; margin-left: 5px; display:none;"/></div><button class="btn btn-success" type="button" style="width:100%;" id="expressionSearchButton">Go!</button><button class="btn btn-secondary" type="button" style="width:100%;" id="expressionResetButton">Reset</button></form-group></div></div></li>');

                $('#expressionSearchButton').click(function() {
                    if (window.expressionFilter) clearExpressionFilterConstraint();
                
                    var expressionPvalue = $('#expressionPvalueSearchInput').val();
                    var expressionTstatistic = $('#expressionTstatisticSearchInput').val();
                    var expressionExpressionSelector = $('#expressionExpressionSelector').val();
                    var expressionDatasetSelector = $('#expressionDatasetSelector').val();
                    var expressionTissue = $('#expressionTissueSearchInput').val();
                        
                    window.expressionFilter = [];

                    var filter = window.minesConfigs.filter(function(v){
                        return v.mineName===window.selectedMineName;
                    })[0].customFilters.filter(function(v){
                        return v.filterName==='Expression';
                    });

                    // Format the query
                    var filterQueryPvalue = filter[0].filterQuery[0];
                    filterQueryPvalue.value = expressionPvalue;
                    var filterQueryTstatistic = filter[0].filterQuery[1];
                    filterQueryTstatistic.value = expressionTstatistic;
                    var filterQueryExpression = filter[0].filterQuery[2];
                    filterQueryExpression.value = expressionExpressionSelector;
                    var filterQueryDatasetName = filter[0].filterQuery[3];
                    filterQueryDatasetName.value = expressionDatasetSelector;
                    var filterQueryTissueName = filter[0].filterQuery[4];
                    filterQueryTissueName.value = expressionTissue;

                    if(expressionDatasetSelector == "E-MTAB-62") {
                        if (expressionPvalue) {
                            window.imTable.query.addConstraint(filterQueryPvalue);            
                            window.expressionFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                        }
    
                        if (expressionTstatistic) {
                            window.imTable.query.addConstraint(filterQueryTstatistic);            
                            window.expressionFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                        }
    
                        window.imTable.query.addConstraint(filterQueryExpression);            
                        window.expressionFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    
                        if (expressionDatasetSelector != "All") {
                            window.imTable.query.addConstraint(filterQueryDatasetName);            
                            window.expressionFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                        }
                    } else if(expressionDatasetSelector == "E-MTAB-513") {
                        filterQueryTissueName.value = expressionTissue;
                        filterQueryExpression.value = $('#expressionFPKMSearchInput').val();

                        // Tissue filter
                        window.imTable.query.addConstraint(filterQueryTissueName);            
                        window.expressionFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                        
                        // FPKM filter    
                        window.imTable.query.addConstraint(filterQueryExpression);            
                        window.expressionFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    window.imTable.query.constraintLogic = window.tableConstraintLogic;

                });
                
                $('#expressionResetButton').click(function() {
                    if (window.expressionFilter) clearExpressionFilterConstraint();
                    $("#expressionTstatisticSearchInput").val('');
                    $("#expressionPvalueSearchInput").val('');
                });                
            }

            // Interactions filter

            filter = availableCustomFilters.filter(function(v){
                return v.filterName==='Interactions';
            });

            if (filter.length > 0) {
                $("#sidebarUl").append(
                    '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Interactions" id="interactionsFilterLi"><a class="nav-link" data-toggle="collapse" href="#interactionsSearchCardBlock" aria-controls="interactionsSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-podcast"></i><span class="nav-link-text"></span>Interactions</a><div class="card" style="width: 100%;"><div class="collapse card-block" id="interactionsSearchCardBlock" style="overflow-y: auto; overflow-x:hidden;"><div class="ul list-group list-group-flush" id="interactionsFilterList"></div><form-group class="ui-front"><div class="row" style="align: center;"><input class="form-control" type="text" id="interactionsParticipant2SearchInput" placeholder="Optional: Participant 2 (symbol)" style="width: 100%; float:left; margin-left: 15px;"/></div><div class="row" style="align: center;"><select class="form-control" id="interactionsTypeSelector" style="width: 45%; float:left; margin-left: 15px;"><option value="All">All (Type)</option><option value="physical">Physical</option><option value="genetic">Genetic</option></select><select class="form-control" id="interactionsDatasetSelector" style="width: 45%;"><option value="All">All (Set)</option><option value="BioGRID interaction data set">BioGRID</option><option value="IntAct interactions data set">IntAct</option></select></div><button class="btn btn-success" type="button" style="width:100%;" id="interactionsSearchButton">Go!</button><button class="btn btn-secondary" type="button" style="width:100%;" id="interactionsResetButton">Reset</button></form-group></div></div></li>');

                getParticipant2SymbolsInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

                    var availableParticipant2Symbol = [];

                    for (var i = 0; i < result.results.length; i++) {
                        if (result.results[i]["item"] != null) {
                            availableParticipant2Symbol.push({
                                label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                                value: result.results[i]["item"]
                            });
                        }
                    }

                    $("#interactionsParticipant2SearchInput").autocomplete({
                        minLength: 3,
                        source: function(request, response) {
                            var results = $.ui.autocomplete.filter(availableParticipant2Symbol, request.term);
                            response(results.slice(0, 15));
                        },
                        select: function(event, ui) {
                            event.preventDefault();
                            $("#interactionsParticipant2SearchInput").val(ui.item.value);
                        },
                        focus: function(event, ui) {
                            event.preventDefault();
                            $("#interactionsParticipant2SearchInput").val(ui.item.value);
                        }
                    });

                });

                $('#interactionsSearchButton').click(function() {
                    if (window.interactionsFilter) clearInteractionsConstraint();
            
                    var participant2Input = $('#interactionsParticipant2SearchInput').val();
                    var interactionsTypeSel = $('#interactionsTypeSelector').val();
                    var interactionsDatasetSel = $('#interactionsDatasetSelector').val();
            
                    window.interactionsFilter = [];

                    var filter = window.minesConfigs.filter(function(v){
                        return v.mineName===window.selectedMineName;
                    })[0].customFilters.filter(function(v){
                        return v.filterName==='Interactions';
                    });

                    // Format the query
                    var filterQueryParticipant2 = filter[0].filterQuery[0];
                    filterQueryParticipant2.value = participant2Input;
                    var filterQueryTypeSel = filter[0].filterQuery[1];
                    filterQueryTypeSel.value = interactionsTypeSel;
                    var filterQueryDatasetSel = filter[0].filterQuery[2];
                    filterQueryDatasetSel.value = interactionsDatasetSel;

                    // Add the constraints
                    if (participant2Input) {
                        window.imTable.query.addConstraint(filterQueryParticipant2);            
                        window.interactionsFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    if (interactionsTypeSel != "All") {
                        window.imTable.query.addConstraint(filterQueryTypeSel);            
                        window.interactionsFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    if (interactionsDatasetSel != "All") {
                        window.imTable.query.addConstraint(filterQueryDatasetSel);            
                        window.interactionsFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    window.imTable.query.constraintLogic = window.tableConstraintLogic;
                    
                });
            
                $('#interactionsResetButton').click(function() {
                    if (window.interactionsFilter) clearInteractionsConstraint();
                    $("#interactionsParticipant2SearchInput").val('');
                });
            }

            // Diseases filter
            filter = availableCustomFilters.filter(function(v){
                return v.filterName==='Diseases';
            });

            if (filter.length > 0) {
                $("#sidebarUl").append(
                    '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Diseases (OMIM)" id="diseasesFilterLi"><a class="nav-link" data-toggle="collapse" href="#diseasesSearchCardBlock" aria-controls="diseasesSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-certificate"></i><span class="nav-link-text"></span>Diseases (OMIM)</a><div class="card" style="width: 100%;"><div class="collapse card-block" id="diseasesSearchCardBlock" style="overflow: auto;"><div class="ul list-group list-group-flush" id="diseasesFilterList"></div><form-group class="ui-front"><input class="form-control" type="text" id="diseasesSearchInput" placeholder="e.g. alzheimer disease"/></form-group></div></div></li>');

                getDiseasesNamesInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

                    var availableDiseasesNames = [];

                    for (var i = 0; i < result.results.length; i++) {
                        if (result.results[i]["item"] != null) {
                            availableDiseasesNames.push({
                                label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                                value: result.results[i]["item"]
                            });
                        }
                    }

                    $("#diseasesSearchInput").autocomplete({
                        minLength: 3,
                        source: function(request, response) {
                            var results = $.ui.autocomplete.filter(availableDiseasesNames, request.term);
                            response(results.slice(0, 15));
                        },
                        select: function(event, ui) {
                            event.preventDefault();
                            $("#diseasesSearchInput").val(ui.item.value);

                            // Filter the table
                            window.imTableConstraint["diseaseName"].push(ui.item.value);
                            updateTableWithConstraints();

                            var buttonId = ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + "button";

                            $("#diseasesFilterList").append(
                                '<div class="input-group" id="' + ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + '"><label class="form-control">' + ui.item.value.slice(0, 22) + '</label><span class="input-group-btn"><button class="btn btn-sm" type="button" id="' + buttonId + '" style="height: 100%;">x</button></span></div>');

                            $("#" + buttonId).click(function() {
                                remove(window.imTableConstraint["diseaseName"], ui.item.value);
                                updateTableWithConstraints();
                                $("#" + ui.item.value.replace(/[^a-zA-Z0-9]/g, '')).remove();
								$("#diseasesSearchInput").val("");
                            });
                        },
                        focus: function(event, ui) {
                            event.preventDefault();
                            $("#diseasesSearchInput").val(ui.item.value);
                        }
                    });

                });
            }

            // ClinVar filter
            filter = availableCustomFilters.filter(function(v){
                return v.filterName==='CLINVAR';
            });

            if (filter.length > 0) {
                $("#sidebarUl").append(
                    '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="ClinVar" id="clinvarFilterLi"><a class="nav-link" data-toggle="collapse" href="#clinvarSearchCardBlock" aria-controls="clinvarSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-eyedropper"></i><span class="nav-link-text"></span>ClinVar</a><div class="card" style="width: 100%;"><div class="collapse card-block" id="clinvarSearchCardBlock" style="overflow-y: auto; overflow-x:hidden;"><form-group class="ui-front"><div style="align: center;"><input class="form-control" type="text" id="clinvarClinicalSignificanceSearchInput" placeholder="Significance (e.g. Pathogenic)" style="width: 100%;"/><input class="form-control" type="text" id="clinvarTypeSearchInput" placeholder="Type (e.g. insertion)" style="width: 100%;"/></div><button class="btn btn-success" type="button" style="width:100%;" id="clinvarSearchButton">Go!</button><button class="btn btn-secondary" type="button" style="width:100%;" id="clinvarResetButton">Reset</button></form-group></div></div></li>');

                getAllelesClinicalSignifanceInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

                    var availableData = [];

                    for (var i = 0; i < result.results.length; i++) {
                        if (result.results[i]["item"] != null) {
                            availableData.push({
                                label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                                value: result.results[i]["item"]
                            });
                        }
                    }

                    $("#clinvarClinicalSignificanceSearchInput").autocomplete({
                        minLength: 2,
                        source: function(request, response) {
                            var results = $.ui.autocomplete.filter(availableData, request.term);
                            response(results.slice(0, 15));
                        },
                        select: function(event, ui) {
                            event.preventDefault();
                            $("#clinvarClinicalSignificanceSearchInput").val(ui.item.value);
                        },
                        focus: function(event, ui) {
                            event.preventDefault();
                            $("#clinvarClinicalSignificanceSearchInput").val(ui.item.value);
                        }
                    });

                });

                getAllelesTypesInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

                    var availableData = [];

                    for (var i = 0; i < result.results.length; i++) {
                        if (result.results[i]["item"] != null) {
                            availableData.push({
                                label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                                value: result.results[i]["item"]
                            });
                        }
                    }

                    $("#clinvarTypeSearchInput").autocomplete({
                        minLength: 2,
                        source: function(request, response) {
                            var results = $.ui.autocomplete.filter(availableData, request.term);
                            response(results.slice(0, 15));
                        },
                        select: function(event, ui) {
                            event.preventDefault();
                            $("#clinvarTypeSearchInput").val(ui.item.value);
                        },
                        focus: function(event, ui) {
                            event.preventDefault();
                            $("#clinvarTypeSearchInput").val(ui.item.value);
                        }
                    });

                });

                // Add the search button
                $('#clinvarSearchButton').click(function() {
                    if (window.clinVarFilter) clearClinVarConstraint();
            
                    var clinVarSignificanceSel = $('#clinvarClinicalSignificanceSearchInput').val();
                    var clinVarTypeSel = $('#clinvarTypeSearchInput').val();
                    
                    if (!clinVarSignificanceSel || !clinVarTypeSel) {
                        if ($("#clinvarFilterAlert").length == 0) {
                            $("#navbarResponsive").prepend("<div class='alert' id='clinvarFilterAlert'><span class='closebtn' id='closeClinVarFilterAlert'>×</span>Please, specify a clinical significante and type in the filter input field.</div><br/>");
            
                            $("#closeClinVarFilterAlert").click(function() {
                                $("#clinvarFilterAlert").hide();
                            });
                        } else {
                            $("#clinvarFilterAlert").show();
                        }
                        return;
                    }
            
                    window.clinVarFilter = [];

                    var filter = window.minesConfigs.filter(function(v){
                        return v.mineName===window.selectedMineName;
                    })[0].customFilters.filter(function(v){
                        return v.filterName==='CLINVAR';
                    });
                    
                    // Format the query
                    var filterQueryTypeSel = filter[0].filterQuery[0];
                    filterQueryTypeSel.value = clinVarTypeSel;
                    var filterQuerySignificanceSel = filter[0].filterQuery[1];
                    filterQuerySignificanceSel = clinVarSignificanceSel;

                    // Add the type constraint
                    window.imTable.query.addConstraint(filterQueryTypeSel);            
                    window.clinVarFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                
                    // Add the significance constraint
                    window.imTable.query.addConstraint(filterQuerySignificanceSel);            
                    window.clinVarFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);

                    window.imTable.query.constraintLogic = window.tableConstraintLogic;
                });

                // Add the reset button
                $('#clinvarResetButton').click(function() {
                    if (window.clinVarFilter) clearClinVarConstraint();
                    $("#clinvarClinicalSignificanceSearchInput").val('');
                    $("#clinvarTypeSearchInput").val('');
                });
            }

            // Protein Localisation
            filter = availableCustomFilters.filter(function(v){
                return v.filterName==='Protein-Localisation';
            });

            if (filter.length > 0) {
                $("#sidebarUl").append(
                    '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Protein Localisation" id="proteinLocalisationFilterLi"><a class="nav-link" data-toggle="collapse" href="#proteinLocalisationSearchCardBlock" aria-controls="proteinLocalisationSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-trello"></i><span class="nav-link-text"></span>Protein Localisation</a><div class="card" style="width: 100%;"><div class="collapse card-block" id="proteinLocalisationSearchCardBlock" style="overflow-y: auto; overflow-x:hidden;"><div class="ul list-group list-group-flush" id="proteinLocalisationFilterList"></div><form-group class="ui-front"><div class="row"><input class="form-control" type="text" id="proteinLocalisationCellTypeSearchInput" placeholder="Cell type (e.g. adipocytes)" style="width: 100%; margin-left: 15px;"/></div><div class="row" style="align: center;"><select class="form-control" id="proteinLocalisationExpressionTypeSelector" style="width: 45%; float:left; margin-left: 15px;"><option value="All">All (Type)</option><option value="APE - two or more antibodies">Two or more antibodies</option><option value="Staining - one antibody only">One antibody only</option></select><select class="form-control" id="proteinLocalisationLevelSelector" style="width: 45%;"><option value="All">All (Level)</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Not detected">Not detected</option></select></div><div class="row" style="align: center;"><input class="form-control" type="text" id="proteinLocalisationTissueSearchInput" placeholder="Tissue" style="width: 45%; float:left; margin-left: 15px;"/><select class="form-control" id="proteinLocalisationRealibilitySelector" style="width: 45%;"><option value="All">All (Realibility)</option><option value="Low">Low</option><option value="Uncertain">Uncertain</option><option value="Supportive">Supportive</option><option value="High">High</option></select></div><button class="btn btn-success" type="button" style="width:100%;" id="proteinLocalisationSearchButton">Go!</button><button class="btn btn-secondary" type="button" style="width:100%;" id="proteinLocalisationResetButton">Reset</button></form-group></div></div></li>');

                getProteinAtlasExpressionCellTypesInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

                    var availableData = [];

                    for (var i = 0; i < result.results.length; i++) {
                        if (result.results[i]["item"] != null) {
                            availableData.push({
                                label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                                value: result.results[i]["item"]
                            });
                        }
                    }

                    $("#proteinLocalisationCellTypeSearchInput").autocomplete({
                        minLength: 2,
                        source: function(request, response) {
                            var results = $.ui.autocomplete.filter(availableData, request.term);
                            response(results.slice(0, 15));
                        },
                        select: function(event, ui) {
                            event.preventDefault();
                            $("#proteinLocalisationCellTypeSearchInput").val(ui.item.value);
                        },
                        focus: function(event, ui) {
                            event.preventDefault();
                            $("#proteinLocalisationCellTypeSearchInput").val(ui.item.value);
                        }
                    });

                });

                getProteinAtlasExpressionTissueNamesInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

                    var availableData = [];

                    for (var i = 0; i < result.results.length; i++) {
                        if (result.results[i]["item"] != null) {
                            availableData.push({
                                label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                                value: result.results[i]["item"]
                            });
                        }
                    }

                    $("#proteinLocalisationTissueSearchInput").autocomplete({
                        minLength: 2,
                        source: function(request, response) {
                            var results = $.ui.autocomplete.filter(availableData, request.term);
                            response(results.slice(0, 15));
                        },
                        select: function(event, ui) {
                            event.preventDefault();
                            $("#proteinLocalisationTissueSearchInput").val(ui.item.value);
                        },
                        focus: function(event, ui) {
                            event.preventDefault();
                            $("#proteinLocalisationTissueSearchInput").val(ui.item.value);
                        }
                    });

                });

                $('#proteinLocalisationSearchButton').click(function() {
                    if (window.proteinLocalisationFilter) clearProteinLocalisationFilterConstraint();
            
                    var proteinLocalisationCellTypeSearchInput = $('#proteinLocalisationCellTypeSearchInput').val();
                    var proteinLocalisationExpressionTypeSelector = $('#proteinLocalisationExpressionTypeSelector').val();
                    var proteinLocalisationLevelSelector = $('#proteinLocalisationLevelSelector').val();
                    var proteinLocalisationTissueSearchInput = $('#proteinLocalisationTissueSearchInput').val();
                    var proteinLocalisationReliabilitySelector = $('#proteinLocalisationRealibilitySelector').val();
            
                    window.proteinLocalisationFilter = [];

                    var filter = window.minesConfigs.filter(function(v){
                        return v.mineName===window.selectedMineName;
                    })[0].customFilters.filter(function(v){
                        return v.filterName==='Protein-Localisation';
                    });

                    // Format the query
                    var filterQueryCellType = filter[0].filterQuery[0];
                    filterQueryCellType.value = proteinLocalisationCellTypeSearchInput;
                    var filterQueryTissue = filter[0].filterQuery[1];
                    filterQueryTissue.value = proteinLocalisationTissueSearchInput;
                    var filterQueryExpressionType = filter[0].filterQuery[2];
                    filterQueryExpressionType.value = proteinLocalisationExpressionTypeSelector;
                    var filterQueryLevel = filter[0].filterQuery[3];
                    filterQueryLevel.value = proteinLocalisationLevelSelector;
                    var filterQueryReliability = filter[0].filterQuery[4];
                    filterQueryReliability.value = proteinLocalisationReliabilitySelector;

                    // Add the constraints
                    if (proteinLocalisationCellTypeSearchInput) {
                        window.imTable.query.addConstraint(filterQueryCellType);            
                        window.proteinLocalisationFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    if (proteinLocalisationTissueSearchInput) {
                        window.imTable.query.addConstraint(filterQueryTissue);            
                        window.proteinLocalisationFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    if (proteinLocalisationExpressionTypeSelector != "All") {
                        window.imTable.query.addConstraint(filterQueryExpressionType);            
                        window.proteinLocalisationFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    if (proteinLocalisationLevelSelector != "All") {
                        window.imTable.query.addConstraint(filterQueryLevel);            
                        window.proteinLocalisationFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    if (proteinLocalisationReliabilitySelector != "All") {
                        window.imTable.query.addConstraint(filterQueryReliability);            
                        window.proteinLocalisationFilter.push(window.imTable.query.constraints[window.imTable.query.constraints.length - 1]);
                    }

                    window.imTable.query.constraintLogic = window.tableConstraintLogic;
                });
            
                $('#proteinLocalisationResetButton').click(function() {
                    if (window.proteinLocalisationFilter) clearProteinLocalisationFilterConstraint();
                    $("#proteinLocalisationCellTypeSearchInput").val('');
                    $("#proteinLocalisationTissueSearchInput").val('');
                });
            }

            // Protein domain filter
            filter = availableCustomFilters.filter(function(v){
                return v.filterName==='Protein-Domain';
            });

            if (filter.length > 0) {
                $("#sidebarUl").append(
                    '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Protein Domain Name" id="proteinDomainFilterLi"><a class="nav-link" data-toggle="collapse" href="#proteinDomainNameSearchCardBlock" aria-controls="proteinDomainNameSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-product-hunt"></i><span class="nav-link-text"></span>Protein Domain Name</a><div class="card" style="width: 100%;"><div class="collapse card-block" id="proteinDomainNameSearchCardBlock" style="overflow: auto;"><div class="ul list-group list-group-flush" id="proteinDomainNameFilterList"></div><form-group class="ui-front"><input class="form-control" type="text" id="proteinDomainNameSearchInput" placeholder="e.g. immunoglobulin subtype"/></form-group></div></div></li>');

                getProteinDomainNamesInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

                    var availableProteinDomainNames = [];

                    for (var i = 0; i < result.results.length; i++) {
                        if (result.results[i]["item"] != null) {
                            availableProteinDomainNames.push({
                                label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                                value: result.results[i]["item"]
                            });
                        }
                    }

                    $("#proteinDomainNameSearchInput").autocomplete({
                        minLength: 3,
                        source: function(request, response) {
                            var results = $.ui.autocomplete.filter(availableProteinDomainNames, request.term);
                            response(results.slice(0, 15));
                        },
                        select: function(event, ui) {
                            event.preventDefault();
                            $("#proteinDomainNameSearchInput").val(ui.item.value);

                            // Filter the table
                            window.imTableConstraint["proteinDomainName"].push(ui.item.value);
                            updateTableWithConstraints();

                            var buttonId = ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + "button";

                            $("#proteinDomainNameFilterList").append(
                                '<div class="input-group" id="' + ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + '"><label class="form-control">' + ui.item.value.slice(0, 22) + '</label><span class="input-group-btn"><button class="btn btn-sm" type="button" id="' + buttonId + '" style="height: 100%;">x</button></span></div>');

                            $("#" + buttonId).click(function() {
                                remove(window.imTableConstraint["proteinDomainName"], ui.item.value);
                                updateTableWithConstraints();
                                $("#" + ui.item.value.replace(/[^a-zA-Z0-9]/g, '')).remove();
								$("#proteinDomainNameSearchInput").val("");
                            });
                        },
                        focus: function(event, ui) {
                            event.preventDefault();
                            $("#proteinDomainNameSearchInput").val(ui.item.value);
                        }
                    });

                });
            }

            //Phenotype Filter
            filter = availableCustomFilters.filter(function(v){
                return v.filterName==='Phenotype';
            });


            if (filter.length > 0) {
                window.imTableConstraint.phenotypeName = [];
                $("#sidebarUl").append(
                    '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Phenotype" id="phenotypeNameFilterLi"><a class="nav-link" data-toggle="collapse" href="#phenotypeNameSearchCardBlock" aria-controls="phenotypeNameSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-product-hunt"></i><span class="nav-link-text"></span>Phenotype</a><div class="card" style="width: 100%;"><div class="collapse card-block" id="phenotypeNameSearchCardBlock" style="overflow: auto;"><div class="ul list-group list-group-flush" id="phenotypeFilterList"></div><form-group class="ui-front"><input class="form-control" type="text" id="phenotypeNameSearchInput" placeholder="e.g. Edema"/></form-group></div></div></li>');
                   try {
                        getPhenotypeNames(sessionStorage.getItem('currentClassView'), []).then(function(result) {
                
                           var availablePhenotypeNames = [];
                
                           for (var i = 0; i < result.results.length; i++) {
                               if (result.results[i]["item"] != null) {
                                   availablePhenotypeNames.push({
                                       label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                                       value: result.results[i]["item"]
                                   });
                               }
                           }
                
                           $("#phenotypeNameSearchInput").autocomplete({
                               minLength: 3,
                               source: function(request, response) {
                                   var results = $.ui.autocomplete.filter(availablePhenotypeNames, request.term);
                                   response(results.slice(0, 15));
                               },
                               select: function(event, ui) {
                                   event.preventDefault();
                                   $("#phenotypeNameSearchInput").val(ui.item.value);
                
                                   // Filter the table
                                   window.imTableConstraint["phenotypeName"].push(ui.item.value);
                                   updateTableWithConstraints();
                
                                   var buttonId = ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + "button";
                
                                   $("#phenotypeFilterList").append(
                                       '<div class="input-group" id="' + ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + '"><label class="form-control">' + ui.item.value.slice(0, 22) + '</label><span class="input-group-btn"><button class="btn btn-sm" type="button" id="' + buttonId + '" style="height: 100%;">x</button></span></div>');
                
                                   $("#" + buttonId).click(function() {
                                       remove(window.imTableConstraint["phenotypeName"], ui.item.value);
                                       updateTableWithConstraints();
                                       $("#" + ui.item.value.replace(/[^a-zA-Z0-9]/g, '')).remove();
									   $("#phenotypeNameSearchInput").val("");
                                   });
                               },
                               focus: function(event, ui) {
                                   event.preventDefault();
                                   $("#phenotypeNameSearchInput").val(ui.item.value);
                               }
                           });
                
                       });
                   } catch (err) {
                       $("#phenotypeNameFilterLi").remove();
                       console.log(err);
                   }
            }

            createDatasetFilter(); // Dataset filter should be the last one

            window.CustomFiltersAdded = true;
        } else {
            createDatasetFilter(); // Dataset filter should be the last one
        }
    }
}

/**
 * Method that updates the entries in the organisms filter
 * @param {string} results: the organism query results from the InterMine server
 */
function updateOrganismsSidebarFilter() {
    var className = sessionStorage.getItem('currentClassView');

    getItemsInClass(className, []).then(function(result) {
        // First remove the li elements
        $('#organismshortnamelist').parent().find('li').remove();

        var colorsData = getColorsArray(result[0].response['results'].length);

        var resultantElements = result[0].response['results'].length;

        var minePreferredOrganisms = window.minesPreferredOrganisms.filter(function(v){
            return v.mineName===window.selectedMineName;
        })[0];

        countPreferredOrganismsAdded = 0;
        if(minePreferredOrganisms != null) {
            minePreferredOrganisms = minePreferredOrganisms.preferredOrganisms;

            // Fill the organism short name dropdown with the preferred organisms, if any
            if(minePreferredOrganisms && minePreferredOrganisms.length > 0) {
                colorsData = getColorsArray(minePreferredOrganisms.length);
                for (var i = 0; i < resultantElements; i++) {
                    var organismName = result[0].response['results'][i]['item'];
                    var organismCount = "(" + result[0].response['results'][i]['count'] + ")";
                    if(minePreferredOrganisms.includes(organismName)) {
                        $("#organismshortnamelist").append('<li class="list-group-item unchecked" style="border-width: 2px; border-style: solid; border-color: ' + colorsData[countPreferredOrganismsAdded] + ';"><a class="nav-link" href="#" style="color:black; text-align:center;"><p class="float-md-left">' + organismName + '</p><p class="float-md-right">' + organismCount + '</p></a></li>');
                        
                        // Add to the organisms colors dict
                        window.organismColorsMap[organismName] = colorsData[countPreferredOrganismsAdded];

                        countPreferredOrganismsAdded++;
                        if(countPreferredOrganismsAdded == 10) break;
                    }
                }
            }
        }

        // At most 10 elements
        resultantElements = Math.max(0, Math.min(resultantElements, 10) - countPreferredOrganismsAdded);

        // Fill the organism short name dropdown with top 10 organisms according to count
        for (var i = 0; i < resultantElements; i++) {
            var organismName = result[0].response['results'][i]['item'];
            var organismCount = "(" + result[0].response['results'][i]['count'] + ")";
            if(minePreferredOrganisms != null) {
                if(!minePreferredOrganisms.includes(organismName)) {
                    $("#organismshortnamelist").append('<li class="list-group-item unchecked" style="border-width: 2px; border-style: solid; border-color: ' + colorsData[countPreferredOrganismsAdded+i] + ';"><a class="nav-link" href="#" style="color:black; text-align:center;"><p class="float-md-left">' + organismName + '</p><p class="float-md-right">' + organismCount + '</p></a></li>');
                    // Add to the organisms colors dict
                    window.organismColorsMap[organismName] = colorsData[countPreferredOrganismsAdded+i];
                }
            } else {
                $("#organismshortnamelist").append('<li class="list-group-item unchecked" style="border-width: 2px; border-style: solid; border-color: ' + colorsData[countPreferredOrganismsAdded+i] + ';"><a class="nav-link" href="#" style="color:black; text-align:center;"><p class="float-md-left">' + organismName + '</p><p class="float-md-right">' + organismCount + '</p></a></li>');
                // Add to the organisms colors dict
                window.organismColorsMap[organismName] = colorsData[countPreferredOrganismsAdded+i];
            }
        }
    });
}

/**
 * Method updates the pie chart based on the organisms present
 * in the current query
 * @param {string} results: the organism query results from the InterMine server
 */
function updatePieChart(result, pieChartID) {
    // Update pie
    if (window.pieChartObject) {
        window.pieChartObject.destroy();
    }

    var ctx = document.getElementById(pieChartID);

    var countData = [];
    var labelsData = [];

    var minePreferredOrganisms = window.minesPreferredOrganisms.filter(function(v){
        return v.mineName===window.selectedMineName;
    })[0];

    countPreferredOrganismsAdded = 0;
    var colorsData = [];
    var currentQueryOrganisms = [];

    if(minePreferredOrganisms != null) {
        minePreferredOrganisms = minePreferredOrganisms.preferredOrganisms;

        // Fill the organism short name dropdown with the preferred organisms, if any
        if(minePreferredOrganisms && minePreferredOrganisms.length > 0) {
            colorsData = [];

            for (var i = 0; i < result[0].response['results'].length; i++) {
                var organismName = result[0].response['results'][i]['item'];
                if(minePreferredOrganisms.includes(organismName)) {
                    countData.push(result[0].response['results'][i]['count']);
                    labelsData.push(result[0].response['results'][i]['item'] + " (" + result[0].response['results'][i]['count'] + ")");
                    colorsData.push(window.organismColorsMap[organismName]);

                    currentQueryOrganisms.push(organismName);

                    countPreferredOrganismsAdded++;
                    if(countPreferredOrganismsAdded == 10) break;
                }
            }
        }
    }

    // At most 10 elements
    resultantElements = Math.max(0, Math.min(result[0].response['results'].length, 10) - countPreferredOrganismsAdded);

    for (var i = 0; i < resultantElements; i++) {
        var organismName = result[0].response['results'][i]['item'];
        if(minePreferredOrganisms != null) {
            if(!minePreferredOrganisms.includes(organismName)) {
                countData.push(result[0].response['results'][i]['count']);
                labelsData.push(result[0].response['results'][i]['item'] + " (" + result[0].response['results'][i]['count'] + ")");
                colorsData.push(window.organismColorsMap[organismName]);
                currentQueryOrganisms.push(organismName);
            }
        } else {
            countData.push(result[0].response['results'][i]['count']);
            labelsData.push(result[0].response['results'][i]['item'] + " (" + result[0].response['results'][i]['count'] + ")");
            colorsData.push(window.organismColorsMap[organismName]);
            currentQueryOrganisms.push(organismName);
        }
    }

    // Count number of unique elements
    var seen = {};
    currentQueryOrganisms = currentQueryOrganisms.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });

    if(currentQueryOrganisms.length != Object.keys(window.organismColorsMap).length) {
        // Remove the checked class from the elements in the sidebar filter
        $('.checked').each(function(i, obj) {
            $(obj).removeClass("checked");
            $(obj).addClass("unchecked");
        });

        // Add the checked class in the sidebar to the correct ones selected in the pie chart
        $('.unchecked').each(function(i, obj) {
            organismShortname = $(obj).find("a p").filter(".float-md-left").toArray()[0].innerHTML;
            if(currentQueryOrganisms.includes(organismShortname)) {
                $(obj).removeClass("unchecked");
                $(obj).addClass("checked");
            }
        });
    } else {
        $('.checked').each(function(i, obj) {
            $(obj).removeClass("checked");
            $(obj).addClass("unchecked");
        });
    }

    var plotTitle = "Number of results for " + sessionStorage.getItem('currentClassView') + " by organism";

    // Plot
    var pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            center: {
                text: '90%',
                color: '#FF6384', // Default is #000000
                fontStyle: 'Arial', // Default is Arial
                sidePadding: 20 // Default is 20 (as a percentage)
            }
        },
        legend: {
            display: true,
            position: 'top',
            onClick: function(e) {
                e.stopPropagation();
            }
        },
        hover: {
            mode: 'nearest',
            intersect: true,
        },
        title: {
            display: true,
            text: plotTitle,
            position: 'bottom'
        },
        tooltips: {
            callbacks: {
                label: function(tooltipItem, data) {
                    return data.labels[tooltipItem.index];
                }
            },
            custom: function(tooltip) {
                if (!tooltip.opacity) {
                    document.getElementById(pieChartID).style.cursor = 'default';
                    return;
                }
            }
        },
        onClick: function(evt, elements) {
            if (elements.length) {
                var index = elements[0]._index;

                selectedSegment = window.pieChartObject.data.labels[index].split("(")[0].trim();

                // Clean organism filters
                if(window.organismFilter) clearOrganismConstraint();
                window.imTableConstraint["organism"] = [];

                // Set the organism filter according to selected pie chart segment
                window.imTableConstraint["organism"].push(selectedSegment);

                // Remove the checked class from the elements in the sidebar filter
                $('.checked').each(function(i, obj) {
                    $(obj).removeClass("checked");
                    $(obj).addClass("unchecked");
                });

                // Add the checked class in the sidebar to the correct ones selected in the pie chart
                $('.unchecked').each(function(i, obj) {
                    organismShortname = $(obj).find("a p").filter(".float-md-left").toArray()[0].innerHTML;
                    if(window.imTableConstraint["organism"].includes(organismShortname)) {
                        $(obj).removeClass("unchecked");
                        $(obj).addClass("checked");
                    }
                });

                updateTableWithConstraints();
            }

            //window.pieChartObject.update();
        }
    };

    window.pieChartObject = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labelsData,
            datasets: [{
                data: countData,
                backgroundColor: colorsData,
            }],
        },
        options: pieOptions
    });
}

function createGoAnnotationFilter() {
    try {
        getOntologyTermsInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

            var availableGoTerms = [];

            for (var i = 0; i < result.results.length; i++) {
                if (result.results[i]["item"] != null) {
                    availableGoTerms.push({
                        label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                        value: result.results[i]["item"]
                    });
                }
            }

            $("#goAnnotationSearchInput").autocomplete({
                minLength: 3,
                source: function(request, response) {
                    var results = $.ui.autocomplete.filter(availableGoTerms, request.term);
                    response(results.slice(0, 15));
                },
                updater: function(item) {
                    return item;
                },
                select: function(event, ui) {
                    event.preventDefault();
                    $("#goAnnotationSearchInput").val(ui.item.value);

                    window.imTableConstraint["goAnnotation"].push(ui.item.value);
                    updateTableWithConstraints();

                    var buttonId = ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + "button";

                    $("#goAnnotationFilterList").append(
                        '<div class="input-group" id="' + ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + '"><label class="form-control">' + ui.item.value.slice(0, 22) + '</label><span class="input-group-btn"><button class="btn btn-sm" type="button" id="' + buttonId + '" style="height: 100%;">x</button></span></div>');

                    $("#" + buttonId).click(function() {
                        remove(window.imTableConstraint["goAnnotation"], ui.item.value);
                        updateTableWithConstraints();
                        $("#" + ui.item.value.replace(/[^a-zA-Z0-9]/g, '')).remove();
						$("#goAnnotationSearchInput").val("");
                    });
                },
                focus: function(event, ui) {
                    event.preventDefault();
                    $("#goAnnotationSearchInput").val(ui.item.value);
                }
            });

        });
    } catch (err) {
        $("#goAnnotationFilterLi").remove();
        console.log(err);
    }
}

function createDatasetFilter() {
    try {
        if ($("#datasetFilterLi").length == 0) {
            $("#sidebarUl").append(
                '<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Dataset Name" id="datasetFilterLi"><a class="nav-link" data-toggle="collapse" href="#datasetNameSearchCardBlock" aria-controls="datasetNameSearchCardBlock" style="color:black;"><i class="fa fa-fw fa-database"></i><span class="nav-link-text"></span>Dataset Name</a><div class="card" style="width: 100%;">        <div class="collapse card-block" id="datasetNameSearchCardBlock" style="overflow-y: auto; overflow-x:hidden;">            <form-group class="ui-front">                <div id="datasetsSelector"></div>            </form-group><button class="btn btn-block btn-warning" id="btnDatasetViewMore" type="button">View more</button></div>    </div></li>');
        }

        getDatasetNamesInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {
            if (!window.datasetNamesLoaded) {
                var availableDatasetNames = [];

                for (var i = 0; i < result.results.length; i++) {
                    if (result.results[i]["item"] != null) {
                        if (result.results[i]["item"] == "KEGG pathways data set" || result.results[i]["item"] == "HGNC identifiers" || result.results[i]["item"] == "BioGRID interaction data set" || result.results[i]["item"] == "IntAct interactions data set" || result.results[i]["item"] == "ClinVar data set" || result.results[i]["item"] == "OMIM diseases") {
                            continue;
                        }
                        availableDatasetNames.push({
                            label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                            value: result.results[i]["item"]
                        });
                    }
                }

                // First remove the form-check elements
                $('#datasetsSelector').empty();

                var resultantElementsNumber = result.results.length;
                var resultantElementsArray = [];

                for (var i = 0; i < availableDatasetNames.length; i++) {
                    resultantElementsArray.push(availableDatasetNames[i]["value"]);
                }

                resultantElementsArray.sort();

                // At most, 3 elements, which are ordered (top 3)
                if (resultantElementsNumber > 3) {
                    resultantElementsNumber = 3;
                }

                // Fill the organism short name dropdown with top 5 organisms according to count
                for (var i = 0; i < resultantElementsNumber; i++) {
                    var datasetName = resultantElementsArray[i];
                    //var datasetCount = "(" + result.results[i]["count"] + ")";
                    $("#datasetsSelector").append(
                        '<div class="form-check" style="margin-left: 10px;"><input class="form-check-input" type="checkbox" id="' + datasetName.replace(/[^a-zA-Z0-9]/g, '') + '" value="' + datasetName + '"><label class="form-check-label" for="' + datasetName + '"><p>' + datasetName + '</p></label></div>');

                    $('#' + datasetName.replace(/[^a-zA-Z0-9]/g, '')).change(function() {
                        if ($(this).is(":checked")) {
                            var checkboxValue = $(this).val();
                            window.imTableConstraint["datasetName"].push(checkboxValue);
                        } else {
                            var checkboxValue = $(this).val();
                            remove(window.imTableConstraint["datasetName"], checkboxValue);
                        }
                        updateTableWithConstraints();
                    });
                }

                window.datasetNamesLoaded = true;
            }

        });
    } catch (err) {
        $("#datasetFilterLi").remove();
        console.log(err);
    }
}

function createPathwaysNameFilter() {
    try {
        getPathwayNamesInClass(sessionStorage.getItem('currentClassView'), []).then(function(result) {

            var availablePathwayNames = [];

            for (var i = 0; i < result.results.length; i++) {
                if (result.results[i]["item"] != null) {
                    availablePathwayNames.push({
                        label: result.results[i]["item"] + " (" + result.results[i]["count"] + ")",
                        value: result.results[i]["item"]
                    });
                }
            }

            $("#pathwayNameSearchInput").autocomplete({
                minLength: 3,
                source: function(request, response) {
                    var results = $.ui.autocomplete.filter(availablePathwayNames, request.term);
                    response(results.slice(0, 15));
                },
                select: function(event, ui) {
                    event.preventDefault();
                    $("#pathwayNameSearchInput").val(ui.item.value);

                    // Filter the table
                    window.imTableConstraint["pathwayName"].push(ui.item.value);
                    updateTableWithConstraints();

                    var buttonId = ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + "button";

                    $("#pathwayFilterList").append(
                        '<div class="input-group" id="' + ui.item.value.replace(/[^a-zA-Z0-9]/g, '') + '"><label class="form-control">' + ui.item.value.slice(0, 22) + '</label><span class="input-group-btn"><button class="btn btn-sm" type="button" id="' + buttonId + '" style="height: 100%;">x</button></span></div>');

                    $("#" + buttonId).click(function() {
                        remove(window.imTableConstraint["pathwayName"], ui.item.value);
                        updateTableWithConstraints();
                        $("#" + ui.item.value.replace(/[^a-zA-Z0-9]/g, '')).remove();
						$("#pathwayNameSearchInput").val("");
                    });
                },
                focus: function(event, ui) {
                    event.preventDefault();
                    $("#pathwayNameSearchInput").val(ui.item.value);
                }
            });

        });
    } catch (err) {
        $("#pathwayNameFilterLi").remove();
        console.log(err);
    }
}

/**
 * Method to add the default filters for all mines
 */
function addDefaultFilters() {
    createPathwaysNameFilter();
    createGoAnnotationFilter();
}

/**
 * Method to fill the mine selector and add the proper event handling
 */
function fillMineSelector() {
    if ($('#mineSelector option').length == 0) {
        var windowUrl = new URL(window.location.href);

        $.when(getIntermines()).done(function(result) {
            //$('#mineSelector').find('option').remove().end().append('<option value="httpCOLONSLASHSLASHwww.humanmine.orgSLASHhumanmineSLASHservice">HumanMine</option>').val('httpCOLONSLASHSLASHwww.humanmine.orgSLASHhumanmineSLASHservice');

            // Need to store current mine to append it at the end, or there are some problems with selector events
            var currentMineNameTemp;
            var currentMineUrlTemp;
            for (var i = 0; i < result.instances.length; i++) {
                //if (result.instances[i].url.startsWith("https")) continue;

                // Temporarily skiping mines with missing concepts for the default filters
                //if (result.instances[i].name == "GrapeMine" || result.instances[i].name == "RepetDB" || result.instances[i].name == "Wheat3BMine" || result.instances[i].name == "WormMine" || result.instances[i].name == "XenMine" || result.instances[i].name == "PlanMine") continue;

                // Mines giving error when querying the API or not responding
                //if (result.instances[i].name == "ModMine" || result.instances[i].name == "MitoMiner") continue;

                var mineUrl = result.instances[i].url;

                // Check for mines not requiring to format the URL
                if (mineUrl[mineUrl.length - 1] == "/") {
                    mineUrl += "service";
                } else {
                    mineUrl += "/service";
                }

                mineUrl = formatMineURL(mineUrl);

                if(result.instances[i].name === window.selectedMineName) {
                    currentMineNameTemp = result.instances[i].name;
                    currentMineUrlTemp = mineUrl;
                } else {
                    $('#mineSelector').append('<option value="' + mineUrl + '">' + result.instances[i].name + '</option>').val(mineUrl);
                }

                // In case that the user gave a mine to be rendered, set it here
                if (windowUrl.searchParams.get("givenMine") && result.instances[i].name == windowUrl.searchParams.get("givenMine")) {
                    window.mineUrl = mineUrl;
                    window.selectedMineName = result.instances[i].name;
                    sessionStorage.setItem('currentClassView', 'Gene');

                    // Update the imTable
                    clearCustomFilters();
                    updateElements(window.imTable.history.currentQuery.constraints, "PieChart");
                    updateGeneLengthChart(window.imTable.history.currentQuery.constraints, "GeneLengthChart");
                }

            }

            $('#mineSelector').append('<option value="' + currentMineUrlTemp + '">' + currentMineNameTemp + '</option>').val(mineUrl);
            $("#mineSelector option[value='" + currentMineUrlTemp + "']").attr("selected","selected");

            // Event handling
            $("#mineSelector").change(function(e) {
                // Sanity check
                
                if(!e.eventPhase) return false;

                var sanity = true;
                var selectedOption = $("#mineSelector option:selected").text();
                var selectedOptionUrl = $(this).val();

                $.ajax({
                    'url': escapeMineURL(selectedOptionUrl),
                    data: {},
                    async: false,
                    error: function(xhr, status) {
                        // Check for error and cancel mine switching if an error appeared

                        // Server or Client errors
                        if ((xhr.status >= 500 && xhr.status <= 511) || (xhr.status >= 400 && xhr.status <= 431)) {
                            // Show error
                            if ($("#unavailableMineAlert").length == 0) {
                                $("#navbarResponsive").prepend("<div class='alert' id='unavailableMineAlert'><span class='closebtn' id='closeUnavailableMineAlert'>×</span>Sorry, it looks like the " + selectedOption + " server is having problems right now. You can try coming back later, or try browsing a different mine using the mine selector in the top-left corner.</div><br/>");

                                $("#closeUnavailableMineAlert").click(function() {
                                    $("#unavailableMineAlert").hide();
                                });
                            } else {
                                $("#unavailableMineAlert").show();
}

                            // Handle error
                            sanity = false;
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            return false;
                        }
                    }
                });

                if (sanity) {
                    // Update settings
                    window.mineUrl = selectedOptionUrl;
                    window.selectedMineName = selectedOption;
                    sessionStorage.setItem('currentClassView', 'Gene');
                    window.datasetNamesLoaded = false;
                    window.CustomFiltersAdded = false;

                    // Update LocalStorage if its available
                    if (typeof(Storage) !== "undefined") {
                        localStorage.setItem("mineUrl", window.mineUrl);
                        localStorage.setItem("selectedMineName", window.selectedMineName);
                    }

                    location.reload();
                }
            });

            // And now fire change event for the dropdown
            $('#mineSelector').trigger('change');

        });
    }
}

/**
 * Method to handle the Custom filters available in the current selected mine
 */
function handleCustomFilters() {
    if (!window.CustomFiltersAdded) {
        var mineData = window.minesConfigs.filter(function(v){
            return v.mineName===window.selectedMineName;
        });

        if (mineData.length > 0) {
            addCustomFilters();
            setDynamicExpressionDatasetSelectorEvents();
            window.CustomFiltersAdded = true;
        } else {
            // Dataset filter should be the last one
            createDatasetFilter();
        }
    }
}

function setDynamicExpressionDatasetSelectorEvents() {
    $('body').on('change','#expressionDatasetSelector',function(){
        var selectedDataset = $('#expressionDatasetSelector').val();

        if(selectedDataset == "E-MTAB-513") {
            $("#expressionExpressionSelector").hide();
            $("#expressionPvalueSearchInput").hide();
            $("#expressionTstatisticSearchInput").hide();
            $("#expressionTissueSearchInput").show();
            $("#expressionFPKMSearchInput").show();
        } else {
            $("#expressionExpressionSelector").show();
            $("#expressionPvalueSearchInput").show();
            $("#expressionTstatisticSearchInput").show();
            $("#expressionTissueSearchInput").hide();
            $("#expressionFPKMSearchInput").hide();
        }
    });
}

/**
 * Method updates the piechart and sidebar elements according to the received constraints
 * @param {string} constraints: the new constraints that the im-table is using
 * @param {string} pieChartID: the div id of the pie chart, in order to update it
 */
function updateElements(constraints, pieChartID) {
    fillMineSelector();
    addDefaultFilters();
    handleCustomFilters();
    initializeKeyManager();
    initializeViewManager();
    addViewManagerSelectOptions();

    try {
        getItemsInClass(sessionStorage.getItem('currentClassView'), constraints).then(function(result) {
            createSidebarEvents();
            updatePieChart(result, pieChartID);
        });
    } catch (err) {
        console.log("There was an error updating the elements", err);
    }
}

/**
 * Method that initializes and manages the key manager keys using LocalStorage and
 * fills the Key Manager modal accordingly
 */
function initializeKeyManager() {
    // Check if LocalStorage is available
    if (typeof(Storage) !== "undefined") {
        window.interminesHashMap = [];
        $.when(getIntermines()).done(function(result) {
            // First get the mines
            for (var i = 0; i < result.instances.length; i++) {
                //if (result.instances[i].url.startsWith("https")) continue;

                // Temporarily skiping mines with missing concepts for the default filters
                //if (result.instances[i].name == "GrapeMine" || result.instances[i].name == "RepetDB" || result.instances[i].name == "Wheat3BMine" || result.instances[i].name == "WormMine" || result.instances[i].name == "XenMine" || result.instances[i].name == "PlanMine") continue;

                // Mines giving error when querying the API or not responding
                //if (result.instances[i].name == "ModMine" || result.instances[i].name == "MitoMiner") continue;

                var mineName = result.instances[i].name;

                var mineUrl = result.instances[i].url;

                // Check for mines not requiring to format the URL
                if (mineUrl[mineUrl.length - 1] == "/") {
                    mineUrl += "service";
                } else {
                    mineUrl += "/service";
                }

                window.interminesHashMap.push({ "mine" : mineName, "mineurl" : mineUrl, "apikey" : "Paste your API key here" });
            }

            // Now check that the API keys in LocalStorage are up-to-date
            if (localStorage.getItem("api-keys")) {
                // Maybe there is a new mine since last update, so let's check
                var currentApiKeysObject = JSON.parse(localStorage.getItem("api-keys"));
                for (var i = 0; i < window.interminesHashMap.length; i++) {
                    if(!findElementJSONarray(currentApiKeysObject, "mine", window.interminesHashMap[i].mine)) {
                        currentApiKeysObject.push({ "mine" : window.interminesHashMap[i].mine, "apikey" : "Paste your API key here" });
                    }
                }
                localStorage.setItem("api-keys", JSON.stringify(currentApiKeysObject));
            } else {
                localStorage.setItem("api-keys", JSON.stringify(window.interminesHashMap));
            }

            // Finally, feed the API manager modal
            $("#apiKeyManagerModalKeysDiv").html("");
            var uptodateAPIkeysArray = JSON.parse(localStorage.getItem("api-keys"));
            for (var i = 0; i < uptodateAPIkeysArray.length; i++) {
                var htmlToAdd = '<div class="apiKeyElement"><label>' + uptodateAPIkeysArray[i].mine + '</label>';
                
                if(uptodateAPIkeysArray[i].apikey != "Paste your API key here" && uptodateAPIkeysArray[i].apikey != "") {
                    htmlToAdd += '<input type="text" value="' + uptodateAPIkeysArray[i].apikey + '"></div>';
                } else {
                    htmlToAdd += '<input type="text" placeholder="Paste your API key here"></div>';
                }

                $("#apiKeyManagerModalKeysDiv").append(htmlToAdd);
            }
        });
    }
}

/**
 * Method that initializes and manages the view manager using LocalStorage and
 * fills the view manager modal accordingly
 */
function initializeViewManager() {
    // First check if LocalStorage is available
    if (typeof(Storage) !== "undefined") {
        // Is the view manager object in Local Storage?
        var currentViewManagerObject;
        if (!localStorage.getItem("view-manager")) {
            localStorage.setItem("view-manager", "[]");
        }
 
        currentViewManagerObject = JSON.parse(localStorage.getItem("view-manager"));


        // Handle the current views display
        var currentMineViewManagerSettings;

        $("#viewManagerModalCurrentViewsDiv").html("");
    
        if(findElementJSONarray(currentViewManagerObject, "mine", window.selectedMineName)) {
            currentMineViewManagerSettings = findElementJSONarray(currentViewManagerObject, "mine", window.selectedMineName);
            if(currentMineViewManagerSettings.viewNames) {
                var currentMineAndViewSettingsValues = currentMineViewManagerSettings.viewNames.split(",");
                for (var i = 0; i < currentMineAndViewSettingsValues.length; i++) {
                    // Add the HTML
                    var htmlToAdd = '<div class="viewManagerElement" id="viewManager' + currentMineAndViewSettingsValues[i] + 'Div"><label id="viewManager' + currentMineAndViewSettingsValues[i] + 'Label">' + currentMineAndViewSettingsValues[i] + '</label>';                
                    htmlToAdd += '<button class="btn btn-secondary" type="button" id="viewManager' + currentMineAndViewSettingsValues[i] + 'RemoveButton" data-dismiss="modal">Remove</button></div>';
                    $("#viewManagerModalCurrentViewsDiv").append(htmlToAdd);

                    // Now handle the remove button
                    $("#viewManager" + currentMineAndViewSettingsValues[i] + "RemoveButton").click(function() {
                        // Get view name from the label
                        var labelViewName = $(this).closest("div").find("label").text();

                        // Get the current view config
                        var currentMineSettings = findElementJSONarray(JSON.parse(localStorage.getItem("view-manager")), "mine", window.selectedMineName);
                        
                        // Remove the correct one
                        var newViewConfig = currentMineSettings.viewNames.split(",");
                        remove(newViewConfig, labelViewName);
                        newViewConfig = newViewConfig.join(",");

                        // Update in structure
                        currentMineSettings.viewNames = newViewConfig;
                        
                        // Update in Local Storage
                        localStorage.setItem("view-manager", JSON.stringify([currentMineSettings]));

                        // Remove from list
                        $("#viewManager" + labelViewName + "Div").remove();

                        // Remove from main view
                        $("#" + labelViewName + "Button").remove();

                        // Is list now empty?
                        if(currentMineSettings.viewNames.split(",")[0] === "") {
                            $("#viewManagerModalCurrentViewsDiv").html("You have not added any custom view for this mine.");
                        }
                    });
                }
            } else {
                $("#viewManagerModalCurrentViewsDiv").html("You have not added any custom view for this mine.");
            }
        } else {
            $("#viewManagerModalCurrentViewsDiv").html("You have not added any custom view for this mine.");
        }

        // Handle the add buton
        $("#viewManagerAddViewButton").click(function() {
            var e = document.getElementById("addViewDropDown");
            var inputViewName = e.options[e.selectedIndex].value;

            currentMineViewManagerSettings = findElementJSONarray(currentViewManagerObject, "mine", window.selectedMineName)

            if(!currentMineViewManagerSettings) {
                currentViewManagerObject.push({ "mine" : window.selectedMineName, "viewNames" : "" });
                currentMineViewManagerSettings = findElementJSONarray(currentViewManagerObject, "mine", window.selectedMineName)
            }

            var currentViewConfig = currentMineViewManagerSettings.viewNames.split(",");
            if(inputViewName != "Gene" && inputViewName != "Protein" && !currentViewConfig.includes(inputViewName)) {
                currentViewConfig.push(inputViewName);
 
                if(currentViewConfig[0] === "") {
                    currentMineViewManagerSettings.viewNames = currentViewConfig[1];
                } else {
                    currentMineViewManagerSettings.viewNames = currentViewConfig.join(",");
                }

                // Save in LS and reload
                localStorage.setItem("view-manager", JSON.stringify([currentMineViewManagerSettings]));
                location.reload();
            }
        });
    }
}

/**
 * Method that updates the gene length chart
 * @param {string} geneLengthChartID: the div id of the gene length chart, in order to update it
 */
function updateGeneLengthChart(constraints, geneLengthChartID) {
    getGeneLengthsInClass(sessionStorage.getItem('currentClassView'), constraints).then(function(result) {
        if (window.geneLengthChartObject) {
            window.geneLengthChartObject.destroy();
        }

        var ctx = document.getElementById(geneLengthChartID);

        var countData = [];
        var labelsData = [];
        var onHoverLabel = [];
        var colorsData = Array(result['results'].length).fill("#337ab7");

        // Statistical values
        var uniqueValues = result['uniqueValues'];
        var minimumValue = result['results'][0]['min'];
        var maximumValue = result['results'][0]['max'];
        var averageValue = parseFloat(result['results'][0]['average']).toFixed(3);
        var elementsPerBucket = (maximumValue - minimumValue) / (result['results'][0].buckets);
        var stdevValue = parseFloat(result['results'][0]['stdev']).toFixed(3);
        var chartTitle = "Distribution of " + uniqueValues + " Gene Lengths";
        var chartSubTitle = "Min: " + minimumValue + ". Max: " + maximumValue + ". Avg: " + averageValue + ". Stdev: " + stdevValue;

        for (var i = 0; i < result['results'].length - 1; i++) {
            // Lower and upper limits for each bucket
            var lowerLimit = Math.round(minimumValue + (elementsPerBucket * i));
            var upperLimit = Math.round(minimumValue + (elementsPerBucket * (i+1)));
            countData.push(Math.log2(result['results'][i]['count']) + 1);
            labelsData.push(lowerLimit + " to " + upperLimit);
            onHoverLabel.push(lowerLimit + " to " + upperLimit + ": " + result['results'][i]['count'] + " values");
        }

        // Plot
        var barChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            scaleBeginAtZero : true,
            elements: {
                center: {
                    text: '90%',
                    color: '#FF6384', // Default is #000000
                    fontStyle: 'Arial', // Default is Arial
                    sidePadding: 20 // Default is 20 (as a percentage)
                }
            },
            legend: {
                display: false,
                position: 'top',
                onClick: function(e) {
                    e.stopPropagation();
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true,
            },
            title: {
                display: true,
                text: [chartTitle, chartSubTitle],
                position: 'bottom'
            },
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero: false,
                        autoSkip: false,
                        maxRotation: 90,
                        minRotation: 90
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        min: 0,
                        display: false
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        return onHoverLabel[tooltipItem.index];
                    }
                },
                custom: function(tooltip) {
                    if (!tooltip.opacity) {
                        document.getElementById(geneLengthChartID).style.cursor = 'default';
                        return;
                    }
                }
            }
        };

        window.geneLengthChartObject = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelsData,
                datasets: [{
                    data: countData,
                    backgroundColor: colorsData,
                }],
            },
            options: barChartOptions
        });
    });
}