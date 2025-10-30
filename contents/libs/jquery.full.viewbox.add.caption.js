/**
 * ViewBox (with image text overlay)
 * @version 0.2.5-custom
 * @author Pavel Khoroshkov (modified by ChatGPT)
 * @link https://github.com/pgooood/viewbox
 */
(function ($) {
  $.fn.viewbox = function (options) {
    if (typeof options === "undefined") options = {};

    options = $.extend(
      {
        template:
          '<div class="viewbox-container"><div class="viewbox-body"><div class="viewbox-header"></div><div class="viewbox-content"></div><div class="viewbox-footer"></div></div></div>',
        loader:
          '<div class="loader"><div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div></div>',
        setTitle: true,
        margin: 20,
        resizeDuration: 400,
        openDuration: 200,
        closeDuration: 200,
        closeButton: true,
        fullscreenButton: false,
        navButtons: true,
        closeOnSideClick: true,
        nextOnContentClick: false,
        useGestures: true,
        imageExt: ["png", "jpg", "jpeg", "webp", "gif"],
        onOpen: null,
        onClose: null,
      },
      options
    );

    var $links = $(this),
      $container = $(options.template),
      $loader = $(options.loader),
      state = false,
      locked = false,
      $current,
      arPopupContent = [];

    if (!$("#viewbox-sprite").length)
      $("body")
        .get(0)
        .insertAdjacentHTML(
          "afterbegin",
          '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="viewbox-sprite" style="display:none"><symbol id="viewbox-close-icon" viewBox="0 0 50 50"><path d="M37.304 11.282l1.414 1.414-26.022 26.02-1.414-1.413z"/><path d="M12.696 11.282l26.022 26.02-1.414 1.415-26.022-26.02z"/></symbol><symbol id="viewbox-prev-icon" viewBox="0 0 50 50"><path d="M27.3 34.7L17.6 25l9.7-9.7 1.4 1.4-8.3 8.3 8.3 8.3z"/></symbol><symbol id="viewbox-next-icon" viewBox="0 0 50 50"><path d="M22.7 34.7l-1.4-1.4 8.3-8.3-8.3-8.3 1.4-1.4 9.7 9.7z"/></symbol><symbol id="viewbox-full-screen-icon" viewBox="0 0 50 50"><path d="M8.242 11.387v9.037h2.053v-6.986h9.197v-2.051H8.242zm22.606 0v2.05h9.367v6.987h2.05v-9.037H30.849zM8.242 29.747v8.866h11.25v-2.05h-9.197v-6.817H8.242zm31.973 0v6.816h-9.367v2.05h11.418v-8.867h-2.051z"/></symbol></svg>'
        );

    function get(name) {
      return $container.find(".viewbox-" + name);
    }

    function set(name, value) {
      get(name).html(value);
    }

    function loader(state) {
      if (state) $loader.appendTo(get("body"));
      else $loader.detach();
    }

    function index() {
      var index = -1;
      if ($current) {
        $links.each(function (i) {
          if ($current.is(this)) {
            index = i;
            return false;
          }
        });
      }
      return index;
    }

    function isImage(href) {
      if (href && $.isArray(options.imageExt) && options.imageExt.length)
        return href.match(
          new RegExp("(" + options.imageExt.join("|") + ")(\\?.*)?$", "i")
        );
    }

    function isAnchor(href) {
      return href.match(/^#.+$/i) && $(href).length;
    }

    function isImageLoaded($img) {
      return $img.get(0).complete;
    }

    function addSvgButton(name) {
      var $e = $('<div class="viewbox-button-default viewbox-button-' + name + '"></div>'),
        href =
          window.location.pathname +
          window.location.search +
          "#viewbox-" +
          name +
          "-icon";
      $e
        .appendTo($container)
        .get(0)
        .insertAdjacentHTML("afterbegin", '<svg><use xlink:href="' + href + '"/></svg>');
      return $e;
    }

    function openWindow(width, height) {
      var $body = get("body"),
        $content = get("content"),
        $header = get("header"),
        $footer = get("footer"),
        w,
        h;
      if (width) {
        $content.width(width);
        $header.width(width);
        $footer.width(width);
      } else if (!state) {
        $header.width(1);
        $footer.width(1);
      }
      if (height) $content.height(height);
      if (!state) {
        state = true;
        $("body").append($container);
        $container.show();
        w = $body.width();
        h = $body.height();
        $container.hide();
        $container.fadeIn(options.openDuration);
      } else {
        w = $body.width();
        h = $body.height();
      }
      $body.css({
        "margin-left": -w / 2,
        "margin-top": -h / 2,
      });
    }

    function show($e) {
      if (locked) return;
      var href = $e.attr("href"),
        caption = options.setTitle
          ? $e.data("viewbox-title") || $e.attr("title")
          : "";
      if (!href) {
        $current = $e;
        showPopup($e, caption);
      } else if (isImage(href)) {
        $current = $e;
        showImage(href, caption);
      } else if (isAnchor(href)) {
        $current = $e;
        showPopup(href, caption);
      }
    }

    function showImage(href, caption, footer) {
      var $img = $('<img class="viewbox-image" alt="">').attr("src", href);
      if (!isImageLoaded($img)) loader(true);
      set("header", caption);
      set("content", "");
      set("footer", footer);
      var $body = get("body"),
        counter = 0,
        $content = get("content"),
        $header = get("header"),
        $footer = get("footer"),
        hasHeader = Boolean(jQuery.type(caption) === "string" && caption.length),
        hasFooter = Boolean(jQuery.type(footer) === "string" && footer.length);
      $header.toggle(hasHeader);
      $footer.toggle(hasFooter);
      openWindow();

      var timerId = window.setInterval(function () {
        if (!isImageLoaded($img) && counter < 1000) {
          counter++;
          return;
        }
        window.clearInterval(timerId);
        loader(false);
        $("body").append($img);

        var wOffset = $body.width() - $content.width() + options.margin * 2,
          hOffset = $body.height() - $content.height() + options.margin * 2,
          headerHeight = hasHeader ? $header.outerHeight() : 0,
          footerHeight = hasFooter ? $footer.outerHeight() : 0,
          windowWidth = $(window).width() - wOffset,
          windowHeight = $(window).height() - hOffset - headerHeight - footerHeight,
          w = $img.width(),
          h = $img.height();

        $img.detach();

        if (w > windowWidth) {
          h = (h * windowWidth) / w;
          w = windowWidth;
        }
        if (h > windowHeight) {
          w = (w * windowHeight) / h;
          h = windowHeight;
        }

        locked = true;
        $header.add($footer).animate({ width: w }, options.resizeDuration);
        $content.animate({ width: w, height: h }, options.resizeDuration);
        $body.animate(
          {
            "margin-left": -(w + wOffset) / 2 + options.margin,
            "margin-top": -(h + hOffset) / 2 + options.margin,
          },
          options.resizeDuration,
          function () {
            // ✅ Add overlay text here
            var $wrapper = $('<div class="viewbox-image-wrapper"></div>').css({
              position: "relative",
              display: "inline-block",
            });
            var $caption = $('<div class="viewbox-image-text"></div>')
              .text(caption || "")
              .css({
                position: "absolute",
                bottom: "10px",
                left: "10px",
                color: "#fff",
                "background-color": "rgba(0,0,0,0.6)",
                padding: "5px 10px",
                "border-radius": "5px",
                "font-size": "14px",
              });

            $wrapper.append($img).append($caption);
            $content.append($wrapper);
            locked = false;
          }
        );
      }, isImageLoaded($img) ? 0 : 200);
    }

    // Navigation + Controls
    $links.filter("a").click(function () {
      $container.trigger("viewbox.open", [this]);
      return false;
    });

    if (options.closeButton) {
      addSvgButton("close").click(function (event) {
        event.stopPropagation();
        $container.fadeOut(options.closeDuration, function () {
          state = false;
        });
      });
    }

    if (options.navButtons && $links.length > 1) {
      addSvgButton("next").click(function (event) {
        event.stopPropagation();
        var i = index() + 1;
        if (i >= $links.length) i = 0;
        show($links.eq(i));
      });
      addSvgButton("prev").click(function (event) {
        event.stopPropagation();
        var i = index() - 1;
        if (i < 0) i = $links.length - 1;
        show($links.eq(i));
      });
    }

    if (options.closeOnSideClick) {
      $container.click(function () {
        $container.fadeOut(options.closeDuration, function () {
          state = false;
        });
      });
    }

    return $container;
  };
})(jQuery);
