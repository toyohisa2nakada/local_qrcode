const _load_script = function (fname) {
    return new Promise((resolve, reject) => {
        const sc = document.createElement("script");
        sc.type = "text/javascript";
        sc.src = fname;
        sc.onload = () => resolve();
        sc.onerror = (e) => reject(e);
        const s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(sc, s);
    });
};

// QRコード作成ライブラリ
await _load_script("https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js");


// 要素を作ってプロパティを設定する。
[Array, "a2e"].reduce((a, e) => {
    a.prototype[e] = function () { return this.reduce((e, f) => { f(e); return e; }); };
    Object.defineProperty(a.prototype, e, { enumerable: false });
});

export const local_qrcode = {
    // URL、localhostの部分がipアドレスの数値になるものの元
    _testurl: undefined,
    _url_string: undefined,
    _init: async function () {
        if (this._testurl !== undefined) {
            return;
        }
        this._testurl = window.location.href;
        // プロトコル部分の抽出
        const proto = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\//.exec(this._testurl)?.[1];
        // ポート番号の抽出、デフォルトのポート番号の場合、空文字になる。
        const port = /(:\d+)/.exec(this._testurl)?.[1] ?? "";
        // パス部分の抽出
        const path = /^(?:[^:]+:\/\/)?[^\/]+(\/.*)/.exec(this._testurl)?.[1];
        // ipは、WebRTCを使って取得する。参考: https://stackoverflow.com/questions/20194722/can-you-get-a-users-local-lan-ip-address-via-javascript
        const ip = await new Promise(async (resolve, reject) => {
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel("");
            const offer = await pc.createOffer(/*pc.setLocalDescription.bind(pc), () => { }*/);
            pc.setLocalDescription(offer);

            pc.onicecandidate = (ice) => {
                if (ice?.candidate && ice.candidate.candidate) {
                    try {
                        const ip = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
                        document.body.appendChild([
                            document.createElement("div"),
                            e => e.textContent = `ip=${ip}`,
                        ].a2e())
                        pc.onicecandidate = () => { };
                        resolve(ip);

                    } catch (err) {
                        resolve(undefined);
                    }
                }
            }
        });

        // localhostがipの数値になったURLを再構成する。
        if(ip !== undefined){
            this._url_string = proto + "://" + ip + port + path;
        }
    },
    inject: async function (elem) {
        await this._init();
        if(this._url_string===undefined){
            return;
        }
        // QRコードの作成
        const qr = new QRious({
            element: elem,
            value: this._url_string,
        });
    },
    url: async function () {
        await this._init();
        if(this._url_string===undefined){
            return "could not find local ip address";
        }
        return this._url_string;
    },
};


