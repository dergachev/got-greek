(function($) {
  $(function() {

    // TODO: use http://jsbeautifier.org/js/lib/beautify.js
    var decodeBookmarklet = function(code) {
      code = code.trim().replace(/^javascript:/,'');
      code = decodeURI(code);
      decodeURI(code);
      return code;
    }

    var encodeBookmarklet = function(code) {
      code = code.trim();
      if (code.slice(0,11) !== "javascript:") {
        code = "javascript:" + code;
      }
      code = encodeURI(code);
      return code;
    }

    $.fn.markleteer = function(options) {
      return this.each(function() {
        var associatedBookmarklet;

        var createButton = function(code, title) {
          return $('<a/>')
            .addClass("bookmarkletLink")
            .text(title || 'Bookmarklet')
            .attr('href', encodeBookmarklet(code))
            .css( {
              'font-family': 'Roboto Slab',
              'font-size': '22px',
              'line-height': 1.5,
              'color': '#1b2d37',
              'background-color': '#cddde6',
              'padding': '5px',
              'border-radius': '5px',
              'text-decoration': 'none',
              'display': 'block',
              'float': 'left',
              'clear': 'left',
              'position': 'absolute',
              'bottom': "8px",
              'right': "8px"
            })
            .on('click', function(event) {
              if (event.altKey) {
                return;
              }
              // TODO: slicker help message; or show preview of effects of bookmarklets
              //console.log("Clicked me", $(this).attr('href'));
              console.log("To install the bookmarklet, drag this link to your bookmarks toolbar.");
              console.log("Bookmarklet source code: ");
              console.log(decodeBookmarklet(this.href));
              return false;
            });
        }

        // var generateBookmarklet(config)

        var appendBookmarklet = function(el) {
          if (typeof(associatedBookmarklet) !== "undefined") {
            associatedBookmarklet.remove();
            associatedBookmarklet = null;
          }

          var code = ''; 
          $.each(el.configs, function() {
            console.log(this);
            code += "var " + this.name + " = '" + $(this).val() +"';\n"
          });
          // use .val() since .text() doesn't seem to be "up-to-date"
          code += $(el).val();

          var title = $(el).attr('title');
          associatedBookmarklet = createButton(code, title);
          $(el).after(associatedBookmarklet);

          // support keeping bookmarklet in sync with a different link
          $.each(el.targets, function(){
            console.log("BOB");
            console.log(this);
            this.href = associatedBookmarklet.attr('href');
            if(options.titleCallback) {
              $(this).text(options.titleCallback());
            }
          });
        }

        // associated related configuration elements
        var associateConfigs = function(el) {
          el.configs = [];
          jQuery('.bookmarkletSetting').each(function() {
            if (el.id == $(this).attr('data-related-bookmarklet')) {
              el.configs.push(this);
              this.bookmarklet = el;
              $(this).change(function(e) {
                appendBookmarklet(el);
              });
            }
          });
          // listen to changes on the element too
          $(el).change(function(e) {
            appendBookmarklet(this);
          })
          
          // associated bookmarklet links to keep in sync
          el.targets = [];
          jQuery('.bookmarkletLink').each(function() {
            if (el.id == $(this).attr('data-related-bookmarklet')) {
              el.targets.push(this);
              this.bookmarklet = el;
            }
          });
        }

        $(this)
          .wrap('<div class="bookmarkletWrapper" style="position: relative; width: 800px;" />')
          .css( { width: '800px'})
          .each( function() { jQuery(this).height( this.scrollHeight +10);}); //from http://stackoverflow.com/a/10080841/9621

        $('.bookmarkletWrapper').hide();

        associateConfigs(this);
        appendBookmarklet(this);

      });
    }

    // now activate our plugin on all textarea.bookmarklet elements
    // TODO: consider replacing with data-api a la bootsrap.js, see:
    //   https://github.com/twitter/bootstrap/blob/master/js/bootstrap-button.js#L96
    //   http://twitter.github.io/bootstrap/javascript.html#buttons
    //   http://api.jquery.com/on/
    // $('textarea.bookmarklet').markleteer();
  });
})(jQuery)
