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
DataTable.ext.classes.search.input = 'rvt-m-left-sm';
DataTable.ext.classes.search.container = 'rvt-p-top-md search-wrapper';

var table = $('#appTable').DataTable({
   orderCellsTop: true,
   paging: false,
   order: [[1, 'asc']],
   language: {
       // Setting the text for the search label, mostly to remove the colon that is there by default
       search: 'Search',
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
            targets: [5, 6],
            type: 'date'
        }
       ],
   initComplete: function () {
       $('#appTable').wrap("<div style='overflow:auto;width:100%;position:relative;'></div>");
       $('.search-wrapper label').addClass('rvt-label');
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
