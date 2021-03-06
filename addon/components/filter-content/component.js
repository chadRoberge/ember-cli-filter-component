import Ember from 'ember';
import layout from './template';

/**
 * @name        FilterContentComponent
 * @description component that applys a simple filter to a specified content model
 *              based on basic matching
 * @extends     external:Ember.Component
 */
export default Ember.Component.extend({

  /* properties
  ------------------------ */

  /**
   * @name        classNames
   * @description class names applied to the component DOM object
   * @type        {array.<string>}
   */
  classNames: ['filter-content'],

  /**
   * @name        content
   * @description the content passed in to be filtered
   * @type        {(array|object)}
   */
  content: [],

  /**
   * @name        debounceFilter
   * @description debounced call to `applyFilter`
   * @type        {Ember.run.later}
   */
  debounceFilter: null,

  /**
   * @name        layout
   * @description component layout
   */
  layout,

  /**
   * @name        properties
   * @description a space-delimited string of dot-notated properties to match
   *              against when filtering
   * @type        {string}
   */
  properties: '',

  /**
   * @name        query
   * @description the query string being filtered against
   * @type        {string}
   */
  query: '',

  /**
   * @name        timeout
   * @description time in milliseconds to debounce `applyFilter`
   * @type        {(number|string)}
   */
  timeout: 420,

  /* computed
  ------------------------ */

  /**
   * @name        filterableProperties
   * @description normalize `properties` and return them as an array
   * @returns     {array} an array of normalized property indices
   */
  normalizedProperties: Ember.computed('properties', function() {

    try {

      var properties = this.get('properties') || '';

      return !properties ? [] : properties
        // replace invalid characters
        .replace(/[^\w\s\@\.\-]+/g, '')
        // replace multiple periods with single periods
        .replace(/[\.]{2,}/g, '.')
        // normalize delimiter to single spaces
        .replace(/(\.+)?\s\1?/g, ' ')
        .split(/\s+/g)
        // remove empty items
        .filter(z => z !== '');

    } catch (exception) {

      if (window.console) { window.console.error('normalizedProperties', exception); }
    }
  }),

  /**
   * @name        queryComputed
   * @description the string being matched against 'contentComputed' replaces
   *              forward slashes to prevent error
   * @returns     {string}
   * @todo        is there a better solution for forward slashes?
   */
  normalizedQuery: Ember.computed('query', function() {

    try {

      var query = this.get('query');

      return Ember.isPresent(query) ? query.replace(/\\+/g, '') : '';

    } catch (exception) {

      if (window.console) { window.console.error('normalizedQuery', exception); }
    }
  }),

  /* observers
  ------------------------ */

  /**
   * @name        setFilterTimer
   * @description an observer that passes `debounceFilter` to `Ember.run.later`
   */
  setFilterTimer: Ember.observer('content', 'normalizedProperties', 'normalizedQuery', function() {

    try {

      // Ember.run.cancel (this.get ('debounceFilter'));
      this.set('debounceFilter', Ember.run.debounce(this, this.applyFilter, parseInt(this.get('timeout'), 10), false));

    } catch (exception) {

      if (window.console) { window.console.error('setFilterTimer', exception); }
    }
  }),

  /* methods
  ------------------------ */

  /**
   * @name        aContainsB
   * @description checks if a contains a match for b; passed values are sloppily
   *              coerced to strings
   * @param       {(number|string)} a
   * @param       {(number|string)} b
   * @returns     {boolean} whether there was a match between the passed values
   */
  aContainsB(a, b) {

    try {

      var matched = false;
      var matchTypes = ['boolean', 'number', 'string'];

      if (matchTypes.indexOf(Ember.typeOf(a)) !== -1 && matchTypes.indexOf(Ember.typeOf(b)) !== -1) {
        // console.log(a, b);
        let regex = new RegExp(`${b}`, 'g');
        // console.log(a.match(regex));
        matched = a.match(regex) ? true : false;
        // matched = Ember.inspect (a).toLowerCase ().match (Ember.inspect (b).toLowerCase ()) !== null;
      }

      return matched;

    } catch (exception) {

      if (window.console) { window.console.error('aContainsB', exception); }
    }
  },

  /**
   * @name        applyFilter
   * @description filters for `query` against value(s) of `properties` in `content`
   */
  applyFilter() {

    try {

      var content = this.get('content') || [];
      var matched = false;
      var properties = this.get('normalizedProperties') || [];
      var propertiesTmp = [];
      var query = this.get('normalizedQuery') || '';
      var values = [];

      if (!content || !properties) { return content ? content : []; }

      if (content.length && properties.length && !!query) {

        content = content.filter(item => {

          matched = false;
          propertiesTmp = properties.slice(0);

          propertiesTmp.forEach(prop => {

            values = values.concat(this.getContentProps(item, prop) || []);
          });

          while (matched === false && values.length) {

            matched = this.aContainsB(values.shift(), query) ? true : false;
          }

          values = [];

          return matched;
        });
      }

      this.set('filteredContent', content);

    } catch (exception) {

      if (window.console) { window.console.error('applyFilter', exception); }
    }
  },

  /**
   * @name        getContentProps
   * @description returns an array of values from `item` at dot notated `property`
   * @param       {(array|object)} item
   * @param       {string} property dot notated index
   * @returns     {array} an array of values matching `property`'s index
   */
  getContentProps(item, property, inception = 0) {

    try {

      var propArr = property.split(/\.+/g); // (/\.?\@each\.?/g);
      var prop = '';
      var values = [];
      var z = [];

      if (!propArr.length) { return []; }
      if (inception > 100) { throw `recursing too far, limit is 100 levels`; }

      prop = propArr.shift();

      // get array items
      if (prop === '@each') {

        if (item.forEach) {

          item.forEach(i => values = values.concat(propArr.length ? this.getContentProps(i, propArr.join('.'), ++inception) : i));
        }

        // get item property
      } else {

        z = Ember.get(item, prop) || [];
        values = values.concat(propArr.length ? this.getContentProps(z, propArr.join('.'), ++inception) : z);
      }

      return values && !!values.length ? values : [];

    } catch (exception) {

      if (window.console) { window.console.error('getContentProps', exception); }
    }
  },

  /**
   * @name        init
   * @description n/a
   */
  init() {

    this._super();
    this.applyFilter();
  },

  /**
   * @name        willDestroy
   * @todo        this may be elligible for deprecation
   * @description runs before the component is destroyed and tears things down
   */
  willDestroy() {

    this._super();
    Ember.run.cancel(this.get('debounceFilter'));
  }
});
