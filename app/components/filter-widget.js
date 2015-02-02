import Ember from 'ember';

// adapted from ember-multiselect

export default Ember.Component.extend({
  layoutName: 'components/multi-select',
  searchText: "*",
  viewLimit: 20,
  selected: null,  // bound to controller
    /**
   * When this is set, the component is disabled and in a loading state.
   */
  isLoading: false,
    /**
   * When the dropdown is loaded for the first time, it should display a list
   * of records. Every other time it should display it according to the filter.
   * When the text filter is used for the first time, this variable will be set
   * to false, so that the next time the filter is cleared, only the selected
   * records will be visible.
   */
  firstTime: true,

  _content: [],
    /**
   * Enables the content into the dropdown to be a promise. If it isn't a promise
   * it resolves straight away. If it is a promise, the component will be in
   * a loading state until the promise resolves.
   */
  content: null,
  loadContent: function() {
    if (this.get('content').then === undefined) {
      //no promise, lets load the data
      this.set('_content', this.get('content'));
      return;
    }
    this.set('isLoading', true);
    var that = this;
    this.get('content').then(function(c) {
      Ember.run(function() {
        that.set('isLoading', false);
        that.set('_content', c);
      });
    });
  }.on('init').observes('content'),
  selectedRecords: function() {
    return this.get('_content').filterBy('selected', true);
  }.property('_content.@each.selected'),
    /**
   * Update selection list which is bound to the controller for RT access
   */
  updateSelections: function() {
    this.set('selected', this.get('selectedRecords'));
  }.observes('_content.@each.selected'),
  selectedRecordsNum: function() {
    return this.get('selectedRecords.length');
  }.property('selectedRecords.@each'),
  numRecords: function() {
    return this.get('filteredRecords.length') < 1;
  }.property('filteredRecords.@each'),
  filteredRecords: function() {
    var fc = this.get('_content'), sd = this.get('searchText');
    if (this.get('searchText').trim() !== "*") {
      // set first time to false the first time we use the search filter
      this.set('firstTime', false);
    }
    if (Ember.isBlank(sd) && !this.get('firstTime')) {
      // Show selected records if only if we have already used the text filter
      fc = this.get('selectedRecords');
    }
    if (sd !== '*') {
      sd = sd.toLowerCase();
      fc = fc.filter(function(row) {
        var id_match = row.get('id').toLowerCase().indexOf(sd) > -1;
        var date_match = false;
        var date = row.get('date');
        if (date !== null) {
          date_match = row.get('date').toString().toLowerCase().indexOf(sd) > -1;
        }
        return id_match || date_match;
      });
    }
    if (fc.get('length') > this.get('viewLimit')) {
      fc = fc.slice(0, this.get('viewLimit'));
    }
    return fc;
  }.property('searchText', '_content.@each'),
  actions: {
    /**
     * Selects filtered records if text filter is set, else select everything
     */
    selectAll: function() {
      var st = this.get('searchText').trim(),
          records = this.get('filteredRecords');
      if (st === "" || st === '*') {
        Ember.debug("Select all records in this list");
        records = this.get('_content');
      }
      records.forEach(function(r) {
        r.set('selected', true);
      });
    },
    deselectAll: function() {
      this.get('selectedRecords').forEach(function(r) {
        r.set('selected', false);
      });
    },
    select: function(record) {
      record.set('selected', !record.get('selected'));
    }
  }
});
