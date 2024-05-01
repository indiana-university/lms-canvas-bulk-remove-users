/*-
 * #%L
 * bulk-remove-users
 * %%
 * Copyright (C) 2022 Indiana University
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


$('#appTable').on( 'draw.dt', function () {
    // after the table is drawn (on init, sort, search, etc) we need to apply the table header accessibility fixes again
    fixTableHeaders();
} )

// since the sorting isn't an actual button, we have to manually handle the sorting events to trigger the SR messsage
$( "th.sorting" ).on( "keypress", function(event) {
    if (event.key === "Enter") {
        sortingNotify($(this));
    }
} );

$("th.sorting").click(function() {
    sortingNotify($(this));
});

function labelCheckboxes() {
    $("th.userCheckbox").each( function() {
        // need to add a label pointing to the user's name in the username column
        let usernameCol = $(this).closest('tr').find('td.displayName')[0];
        let userCB = $(this).find('input[type=checkbox]')[0];
        $(userCB).attr("aria-labelledby", usernameCol.id);
        $(userCB).removeAttr("aria-label");
    });
}


function userSelectedCounter() {
    // Get all the selected checkboxes, except the "select-all" one up in the table header
    let newValue = document.querySelectorAll('input.dt-select-checkbox:checked:not(.header-checkbox)').length;
    $(".users-selected-text").text(newValue + ' selected');

    // enable/disable buttons while we're in here
    if (newValue > 0) {
        $(".modalButton").removeAttr('disabled');
        $(".modalButton").attr('aria-disabled', 'false');
    } else {
        $(".modalButton").attr('disabled', '');
        $(".modalButton").attr('aria-disabled', 'true');
    }
}

// Add SR notification of the sorting change
sortingNotify = function (sortHeader) {
    let sortBy = sortHeader.text();
    let currentSort = sortHeader.attr("aria-sort");
    let direction = currentSort != null && currentSort == 'ascending' ? "descending" : "ascending";
    $("#sortingAnnc").text("Sorting by " + sortBy + " " + direction);
}

addDescriptiveLabels = function () {
    // Add SR search instructions
	$('div.search-wrapper').find('input[type=search]').attr('aria-describedby','searchText');
}

fixTableHeaders = function() {
    // remove the role=button from the inner span.  If DT insists on using roles instead of an actual button, it needs to be
    // on the th tag since this is where they decided to put the tabindex
    $("span.dt-column-title").removeAttr("role");
    $("th.sorting").attr("role", "button");

    // DT uses aria-label for its extra description on the sort headers. However, this means it is read on every
    // cell in the table. The label should be the visual table header and the description should be the sorting instructions
    $("th.sorting").each( function() {
        let sortHeader = $(this);
        let sortBy = sortHeader.text();
        let currentSort = sortHeader.attr("aria-sort");
        let direction = currentSort != null && currentSort == 'ascending' ? "descending" : "ascending";
        $(this).attr("aria-description", "Activate to sort by " + sortBy + " " + direction);
        $(this).removeAttr("aria-label");
    });
}

function applyAccessibilityOverrides() {
    // add more descriptive labels to the form elements with implicit labels
    addDescriptiveLabels();
    // add meaningful labels to the checkboxes
    labelCheckboxes();
}

$(".modalButton").click(function() {
    // find the modal body
    let modalList = $("#edit-tool-properties").find(".modal-list");

    // clear the ul, in case a cancel button happened
    $(modalList).empty();

    // loop through all the non-header checked check boxes (class checkbox)
    $('input.dt-select-checkbox:checked:not(.header-checkbox)').each(function(index) {
        let displayName = $(this).closest('tr').find('.displayName').text();
        let username = $(this).closest('tr').find('.username').text();
        let dupeBonus = "";
        let isDupe = ($(this).closest('tr').attr('data-is-dupe') === 'true');
        if (isDupe) {
            separator = " - ";
            let role = $(this).closest('tr').find('.role').text();
            let section = $(this).closest('tr').find('.section').text();
            dupeBonus = " - " + role + " (" + section + ")";
        }
        $(modalList).append("<li>" + displayName + " (" + username + ")" + dupeBonus + "</li>")
    });
});

$('#dialog-submit').click(function() {
    // set all the loading icon things for the 'Yes, remove' button
    let button = $(this);
    button.addClass("rvt-button--loading");
    button.prop('disabled', 'true');
    button.attr('aria-busy', 'true');
    button.append('<div class="rvt-loader rvt-loader--xs" aria-label="Content loading"></div>');

    // disable the cancel button
    $("#dialog-cancel").attr('disabled', '');
    $("#dialog-cancel").attr('aria-disabled', 'true');

    // Some browsers need this to have submissions work correctly
    $('#bulk-remove-users-form').submit();
});

// Customize a few of the search input related wrapper classes
DataTable.ext.classes.search.input = 'rvt-m-left-xs';
DataTable.ext.classes.search.container = 'rvt-p-top-md search-wrapper';

var table = $('#appTable').DataTable({
   orderCellsTop: true,
   paging: false,
   order: [[1, 'asc']],
   language: {
       // Setting the text for the search label, mostly to remove the colon that is there by default
       search: 'Search',
       select: {
          aria: {
              headerCheckbox: 'Select all users'
          }
       }
   },
   columnDefs: [
        {
            targets: [0],
            orderable: false,
            // The .8 and .7 are the column indexes containing the data that will be used for the checkbox value and name
            render: DataTable.render.select('.8', '.7')
        },
        {
            targets: [7, 8],
            visible: false,
            searchable: false
        },
        {
            // Enabling filters for these columns
            targets: [3, 4],
            lmsFilters: true
        },
        {
            // DataTables sorting defaults to third click removing sorting. This sets it to asc/desc only
            targets: 'sorting',
            orderSequence: ['asc', 'desc']
        }
       ],
   initComplete: function () {
       $('#appTable').wrap("<div style='overflow:auto;width:100%;position:relative;'></div>");
       $('.search-wrapper label').addClass('rvt-label rvt-ts-16');

       applyAccessibilityOverrides();
   },
   select: {
        selector: 'th:first-child',
        style: 'multi',
        info: false
   },
   layout: {
       topStart: {
           // Configuration for the filters
           lmsFilters: {
               containerClass: 'rvt-flex-md-up rvt-p-top-md',
               includeClearFilters: true
           }
       },
   }
});

// Mark the autogenerated checkbox that ends up in the header with a special class, so it can be excluded from actual selected rows
$('thead input[type=checkbox]').addClass('header-checkbox');

// Adding event listeners so that we can update controls based on "external" events
table.on('select deselect user-select filter-update draw', function () {
    // Update selected counts after row (de)selections and filters
    // The draw event catches the regular search filtering
    userSelectedCounter();
});
