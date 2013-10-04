var Clock = (function() {
    function Clock(el) {
        this.el = el;
        this.timer = 0;
        this.armTime =  0;
        this.timeTimer = false;
    };

    function pad(str) {
        str = ''+str;
        if (str.length<2) {
            str = '0'+str;
        }
        return str;
    }

    function formatTime(msec) {
        var secs = Math.floor(msec/1000);
        var hsec = Math.floor((msec/100)) % 10;
        var sec = secs % 60;
        var min = Math.floor((secs-sec)/60);
        var str = min+':'+pad(sec);
        // if (min===0 && sec < 10) {
            str += '.'+hsec;
        // }
        return str;
    }

    Clock.prototype.drawTime = function drawTime(timer,className) {
        this.el.innerHTML = '<span class="'+className+'">'+formatTime(timer)+'</span>';
    }

    Clock.prototype.tick = function() {
        var now = +(new Date());
        this.timer = this.armTime*1000 - (now - this.startTime);
        if (this.timer <= 0) {
            this.timer = 0;
            this.zero();
            this.stop();
        } else {
            this.drawTime(this.timer,'started');
        }
    }

    Clock.prototype.arm = function arm(sec) {
        this.stop();
        this.armTime = sec||2.5*60;
        this.timer = this.armTime*1000;
        this.drawTime(this.timer,'armed');
    }
    Clock.prototype.start = function start(timestamp,sec) {
        this.arm(sec||this.armTime);
        this.startTime = timestamp||(+(new Date()));
        var self = this;
        this.timeTimer = window.setInterval(function() {
            self.tick();
        },10);
        trackA.play();
        this.running = true;
        window.setTimeout(function() {
            trackB.pause();
            trackB.load('mp3/lossetrack-B.mp3');
        },500);
    }
    Clock.prototype.zero = function() {
        trackB.play();
    }
    Clock.prototype.stop = function stop() {
        this.running = false;
        window.clearInterval(this.timeTimer);
        this.drawTime(this.timer,'stopped');
        this.timeTimer = false;
        // window.setTimeout(function() {
            trackA.pause();
            trackA.load('mp3/lossetrack-A +6.mp3');
        // },10);
    }

    return Clock;
}());

var FontFitter = (function() {
    function FontFitter(el) {
        this.el = el;
    }

    FontFitter.prototype.determineParameters = function determineParameters() {
        this.el.style.fontSize = '100px';
        var s1 = this.el.firstChild.offsetWidth;
        this.el.style.fontSize = '200px';
        var s2 = this.el.firstChild.offsetWidth;
        this.a = (s2-s1)/100;
        this.b = (s1 - this.a*100);
    }

    FontFitter.prototype.size = function size() {
        if (!(this.a && this.b)) {
            this.determineParameters();
        }
        var w = this.el.clientWidth;
        var fs = (w - this.b)/this.a;
        this.el.style.fontSize = fs+'px';
        var s = this.el.firstChild.offsetWidth;
    }

    return FontFitter;
}());

var trackA, trackB;
function initAudio () {
    trackA = new Audio5js({
        swf_path: 'swf/audio5js.swf',
        ready: function () {
            this.load('mp3/lossetrack-A +6.mp3');
        }
    });
    trackB = new Audio5js({
        swf_path: 'swf/audio5js.swf',
        ready: function () {
            this.load('mp3/lossetrack-B.mp3');
            initialize();
        }
    });
}
// initAudio();

function initialize() {
    var out = document.getElementById('out1');
    var c = new Clock(out);
    c.arm();

    // var ff = new FontFitter(out);
    // ff.size();
    // window.addEventListener('resize',function() {
    //     ff.size();
    // });

    function setColor(col) {
        document.body.style.backgroundColor = col;
    }

    var position = {
        x: 0,
        y: 0
    };
    var size = 340;
    function nudge(direction,amount) {
        position[direction] += amount||10;
        out.style.left = position.x+'px';
        out.style.top = position.y+'px';
    }
    function sizeClock(amount) {
        size += amount||0;
        out.style.fontSize = size+'px';
    }

    if (window.io) {
        var socket = io.connect('http://io.example.com:1390/');
        socket.on('clock', function (data) {
            var bd = data.cmd||null;
            switch (bd) {
                case 'color':
                    setColor(data.color);
                    break;
                case 'arm':
                    c.arm(data.countdown);
                    break;
                case 'start':
                    c.start(null,data.countdown);
                    break;
                case 'stop':
                    c.stop();
                    break;
                case 'nudge':
                    nudge(data.direction,data.amount);
                    break;
                case 'size':
                    sizeClock(data.amount);
                    break;
            }
        });
    }

    document.addEventListener('keydown',function(e) {
        var key = e.which;
        switch(key) {
            case 65:    //a
                c.arm();
                break;
            case 88:    //x
                c.stop();
                break;
            case 83:    //s
            case 32:    //space
                c.running?c.stop():c.start();
                break;
            case 219:   //[
                sizeClock(-1);
                break;
            case 221:   //]
                sizeClock(1);
                break;
        }
    });
};