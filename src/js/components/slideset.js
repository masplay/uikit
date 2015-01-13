(function(addon) {

    var component;

    if (jQuery && UIkit) {
        component = addon(jQuery, UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-slideset", ["uikit"], function(){
            return component || addon(jQuery, UIkit);
        });
    }

})(function($, UI){

    "use strict";

    var Animations;

    UI.component('slideset', {

        defaults: {
            visible   : 3,
            animation : 'scale',
            duration  : 400
        },

        sets: [],

        boot: function() {

            // auto init
            UI.ready(function(context) {

                UI.$("[data-@-slideset]", context).each(function(){

                    var ele = UI.$(this);

                    if(!ele.data("slideset")) {
                        var plugin = UI.slideset(ele, UI.Utils.options(ele.attr("data-@-slideset")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.activeSet = false;
            this.list      = this.element.find('.@-slideset-list');
            this.children  = this.list.children();


            this.sets     = array_chunk(this.children, this.options.visible);

            for(var i=0;i<this.sets.length;i++) {
                this.sets[i].hide().addClass('uk-width-1-'+this.options.visible);
            }

            this.show(0);

            this.on("click", '[data-@-set]', function(e) {

                e.preventDefault();

                var set = UI.$(this).data(UI._prefix+'Set');

                if ($this.activeSet === set) return;

                switch(set) {
                    case 'next':
                    case 'previous':
                        $this[set=='next' ? 'next':'previous']();
                        break;
                    default:
                        $this.show(set);
                }

            });

            this.on('swipeRight swipeLeft', function(e) {
                $this[e.type=='swipeLeft' ? 'next' : 'previous']();
            });
        },

        show: function(setIndex) {

            var $this = this;

            if (this.activeSet === setIndex || this.animating) {
                return;
            }

            var current   = this.sets[this.activeSet] || [],
                next      = this.sets[setIndex],
                animation = Animations[this.options.animation] || function(current, next) {

                    if (!$this.options.animation) {
                        return Animations.none.apply($this);
                    }

                    var anim = $this.options.animation.split(',');

                    if (anim.length == 1) {
                        anim[1] = anim[0];
                    }

                    anim[0] = anim[0].trim();
                    anim[1] = anim[1].trim();

                    return coreAnimation.apply($this, [anim, current, next]);
                };

            $this.animating = true;

            animation.apply($this, [current, next, setIndex < this.activeSet ? -1:1]).then(function(){

                UI.Utils.checkDisplay(next, true);

                $this.children.hide();
                $this.sets[setIndex].show();
                $this.animating = false;

                $this.activeSet = setIndex;
            });

        },

        next: function() {
            this.show(this.sets[this.activeSet + 1] ? (this.activeSet + 1) : 0);
        },

        previous: function() {
            this.show(this.sets[this.activeSet - 1] ? (this.activeSet - 1) : (this.sets.length - 1));
        }
    });

    Animations = {

        'none': function() {
            var d = $.Deferred();
            d.resolve();
            return d.promise();
        },

        'fade': function(current, next) {
            return coreAnimation.apply(this, ['@-animation-fade', current, next]);
        },

        'slide-bottom': function(current, next) {
            return coreAnimation.apply(this, ['@-animation-slide-bottom', current, next]);
        },

        'slide-top': function(current, next) {
            return coreAnimation.apply(this, ['@-animation-slide-top', current, next]);
        },

        'slide-vertical': function(current, next, dir) {

            var anim = ['@-animation-slide-top', '@-animation-slide-bottom'];

            if (dir == -1) {
                anim.reverse();
            }

            return coreAnimation.apply(this, [anim, current, next]);
        },

        'slide-left': function(current, next) {
            return coreAnimation.apply(this, ['@-animation-slide-left', current, next]);
        },

        'slide-right': function(current, next) {
            return coreAnimation.apply(this, ['@-animation-slide-right', current, next]);
        },

        'slide-horizontal': function(current, next, dir) {

            var anim = ['@-animation-slide-left', '@-animation-slide-right'];

            if (dir == -1) {
                anim.reverse();
            }

            return coreAnimation.apply(this, [anim, current, next]);
        },

        'scale': function(current, next) {
            return coreAnimation.apply(this, ['@-animation-scale-up', current, next]);
        }
    };

    UI.slideset.animations = Animations;

    // helpers

    function coreAnimation(cls, current, next) {

        var d = $.Deferred(), clsIn, clsOut, release;

        if (next[0]===current[0]) {
            d.resolve();
            return d.promise();
        }

        if (typeof(cls) == 'object') {
            clsIn  = UI.prefix(cls[0]);
            clsOut = UI.prefix(cls[1] || cls[0]);
        } else {
            clsIn  = UI.prefix(cls);
            clsOut = clsIn;
        }

        release = function() {

            if (current && current.length) current.hide().removeClass(UI.prefix(clsOut+' @-animation-reverse')).css('animation-delay', '');

            next.each(function(i){
                $(this).css('animation-delay', (i*100)+'ms');
            });

            next.addClass(clsIn).last().one(UI.support.animation.end, function() {

                next.removeClass(''+clsIn+'').css({opacity:'', display:'', 'animation-delay':''});

                d.resolve();

            }.bind(this)).end().show();
        };

        next.css('animation-duration', this.options.duration+'ms');

        if (current && current.length) {

            current.css('animation-duration', this.options.duration+'ms');

            current.each(function(i){
                $(this).css('animation-delay', (i*100)+'ms');
            });

            current.css('display', 'none').addClass(UI.prefix(clsOut+' @-animation-reverse')).last().one(UI.support.animation.end, function() {
                release();
            }.bind(this)).end().css('display', '');

        } else {
            release();
        }

        return d.promise();
    }

    function array_chunk(input, size) {

        var x, i = 0, c = -1, l = input.length || 0, n = [];

        if (size < 1) {
            return null;
        }

        while (i < l) {

            x = i % size;

            if(x) {
                n[c][x] = input[i];
            } else {
                n[++c] = [input[i]];
            }

            i++;
        }

        i = 0;
        l = n.length;

        while (i < l) {
            n[i] = jQuery(n[i]);
            i++;
        }

        return n;
    }

});
