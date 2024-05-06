/*-
 * #%L
 * bulk-remove-users
 * %%
 * Copyright (C) 2022 - 2024 Indiana University
 * %%
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. Neither the name of the Indiana University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 * #L%
 */
/**
 * Register a new Datatable feature for filters
 * datatablesSettings - Settings coming from datatables
 * opts - Hash of custom properties passed in via the 'layout'
 **/
DataTable.feature.register('lmsFilters', function (datatablesSettings, opts) {
    // Define defaults for the component
    let options = Object.assign({
        includeClearFilters: false,
        containerClass: 'undefined'
    }, opts);

    // Initialize a container div for all the filters
    let container = $('<div></div>');
    if (options.containerClass && options.containerClass !== "undefined") {
        container.addClass(options.containerClass);
    }

    // Array to track individual filters so we can find them to reset later
    let filterIds = []

    // Loop through all the column definitions, looking for any with the filtering enabled
    datatablesSettings.aoColumns.forEach(function(colDef) {
        if (colDef.lmsFilters && typeof colDef.lmsFilters !== "undefined") {
            // Get the unique name and id for the filter
            let filterName = datatablesSettings.aoColumns[colDef.idx].sTitle;
            let filterId = "filter-" + filterName.replace(/\W/g,'_').toLowerCase();

            // Track individual filters so we can find them to reset later
            filterIds.push({filterId: filterId, colIndex: colDef.idx});

            // Merge some custom values with any options defined in the column definition
            let params = Object.assign(colDef.lmsFilters,
                { colIndex: colDef.idx, filterName: filterName, filterId: filterId });

            // Add the filter to the container div
            let filter = buildLmsFilter(datatablesSettings, params);
            container.append(filter);
        }
    });

    // Optionally include a button to clear all the filters
    if (options.includeClearFilters) {
        // Stringify and base64 encode the values for easier passing to the onclick handler
        let base64Json = btoa(JSON.stringify(filterIds));
        let clearFilter = `
            <div class="rvt-p-top-xs rvt-m-right-sm-md-up">
                <button id="clear-filters" type="button" class="rvt-button rvt-button--secondary" onclick="clearAllFilters('${base64Json}')">Clear Filters</button>
            </div>
        `;

        container.append(clearFilter);
    }

    return container;
});

/**
 * Build a filter
 * datatablesSettings - Settings coming from datatables
 * options - Options used to create this instance of the filter
 **/
function buildLmsFilter(datatablesSettings, options) {
    let column = datatablesSettings.api.columns(options.colIndex);
    let filterOptions = column.data().eq(0).unique().sort();
    let filterId = options.filterId;
    let filterName = options.filterName;
    let colIdx = options.colIndex;

    let optionsHtml = '';

    // Build the selectable option for each filter item
    filterOptions.each(function(item) {
        let itemId = item.replace(/\W/g,'_').toLowerCase();
        let key = filterId + "-" + itemId;
        let escapedItem = DataTable.util.escapeHtml(item);

        optionsHtml +=
            `<li>
                <div class="rvt-checkbox">
                    <input type="checkbox" id="${key}" name="${filterId}-checkboxes" class="filter-input" value="${escapedItem}" data-text="${escapedItem}" onchange="filterCheckboxChange(this, ${colIdx}, '${filterId}')"/>
                    <label for="${key}" class="rvt-m-right-sm rvt-text-nobr">${item}</label>
                </div>
            </li>`;
    });

    let container =
        `<div class="rvt-dropdown rvt-p-top-xs rvt-m-right-sm-md-up" role="region" aria-label="Controls for filtering users by ${filterName}" data-rvt-dropdown="${filterId}-dropdown-filter">
              <div id="${filterId}-selected-text" class="rvt-sr-only" aria-live="polite"></div>
              <button id="${filterId}-button" type="button" class="rvt-button rvt-button--secondary transparencyOverride" data-rvt-dropdown-toggle="${filterId}-filter-options">
                  <span class="rvt-dropdown__toggle-text">Filter By ${filterName} <span id="${filterId}-filters-active"></span></span>
                  <svg aria-hidden="true" fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="m15.146 6.263-1.292-1.526L8 9.69 2.146 4.737.854 6.263 8 12.31l7.146-6.047Z"></path></svg>
              </button>
              <div id="${filterId}-dropdown" class="rvt-dropdown__menu" data-rvt-dropdown-menu="${filterId}-filter-options" hidden>
                  <button id="${filterId}-remove-filters" type="button" aria-describedby="${filterId}-filter-count" class="rvt-button rvt-button--secondary" onclick="clearFilter('${filterId}-checkboxes', ${colIdx}, '${filterId}')">Remove ${filterName} Filters</button>
                  <span id="${filterId}-filter-count" class="rvt-sr-only">No filters currently selected</span>
                  <div id="${filterId}-division">
                      <fieldset class="rvt-fieldset rvt-p-left-sm">
                          <legend class="rvt-text-bold rvt-p-tb-xs">${filterName}</legend>
                          <ul class="rvt-list-plain">
                              ${optionsHtml}
                          </ul>
                      </fieldset>
                  </div>
              </div>
          </div>`;

    return container;
}

/**
 * Clear the specified filter's selected values
 * checkboxName - Element name for all the checkboxes to be cleared
 * colIdx - Column index (zero based) of the data being filtered
 * filterIdPrefix - Prefix used in all the filter related controls
 **/
function clearFilter(checkboxName, colIdx, filterIdPrefix) {
    $('input[type="checkbox"][name="' + checkboxName + '"].filter-input:checked').prop('checked', false);

    table.column(colIdx).search('', true, false).draw();
    computeAndDisplayActiveFilters(filterIdPrefix);
}

/**
 * Clear all filters
 * encodedData - Base64 encoded, string-ified json data
 **/
function clearAllFilters(encodedData) {
    // Clear filters
    $('input[type="checkbox"].filter-input:checked').prop('checked', false);

    let jsonData = JSON.parse(atob(encodedData));

    // Loops through each filter identified by the json
    jsonData.forEach(function(filterItem) {
        //filterIds.push({filterId: filterId, colIndex: colDef.idx});
        table.column(filterItem.colIndex).search('', true, false).draw();
        computeAndDisplayActiveFilters(filterItem.filterId);
    });
}

/**
 * Event handler for when a filter checkbox changes
 * element - Dom element where the event originated
 * colIdx - Column index (zero based) of the data being filtered
 * filterIdPrefix - Prefix used in all the filter related controls
 **/
function filterCheckboxChange(element, colIdx, filterIdPrefix) {
    let values = [];
    // Get all checked values
    $('input[type="checkbox"][name="' + element.name + '"].filter-input:checked').each(function() {
        values.push(DataTable.util.escapeRegex(htmlDecode($(this).val())));
    });

    // Escape things, and use exact match (wrapped with ^ and $)
    let regExpStr = values.map(function(val) { return "^" + val + "$" }).join("|");

    // Search for all selected values in the appropriate column
    table.column(colIdx).search(regExpStr, true, false).draw();
    computeAndDisplayActiveFilters(filterIdPrefix);
}

/**
 * Decode any html characters in the value so that the original content can be searched on
 * value - String to decode
 **/
function htmlDecode(value) {
  return $("<textarea/>").html(value).text();
}

/**
 * Update descriptive text when a filter has items (un)checked
 * filterIdPrefix - Prefix used in all the filter related controls
 **/
function computeAndDisplayActiveFilters(filterIdPrefix) {
    let checkedFilters = $('input[type="checkbox"][name="' + filterIdPrefix + '-checkboxes"].filter-input:checked');
    let numberOfChecked = checkedFilters.length
    let newContent = ""
    let filterCountText = "No filters currently selected"
    let filterInfoText = "No filters selected"

    if (numberOfChecked !== 0) {
        newContent = "(" + numberOfChecked + ")"

        let filterValues = [];
        checkedFilters.each(function( c ) {
            filterValues.push($(this).data("text"));
        });

        filterInfoText = "Selected filters: " + filterValues.join();

        let fv = numberOfChecked === 1 ? 'filter' : 'filters';
        filterCountText = numberOfChecked + ' ' + fv + ' currently selected';
    }

    $("#" + filterIdPrefix + "-selected-text").html(filterInfoText);

    //${filterId}-filters-active
    $("#" + filterIdPrefix + "-filters-active").html(newContent)

    //${filterId}-filter-count
    $("#" + filterIdPrefix + "-filter-count").html(filterCountText)

    table.trigger('filter-update');
}
