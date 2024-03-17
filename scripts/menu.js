class Menu {
    constructor(game) {
        this.game = game;
        this.container = document.getElementById('menu');

        // main page
        this.mainPage = document.createElement('div');
        this.start_btn_text = 'Start';
        this.createMainPage();
        // setting submenu
        this.settings_container = document.createElement('div');

        this.createSettings();

        this.pages = [this.mainPage, this.settings_container];
        this.avoidReset = false;

        this.open();
    }
    createMainPage() {
        this.mainPage.classList.add('menu', 'page');
        this.start_btn = document.createElement('div');
        this.start_btn.id = 'start';
        this.start_btn.classList.add('btn');
        this.start_btn.textContent = this.start_btn_text;
        this.start_btn.onclick = () => {
            if (!this.avoidReset) {
                this.game.reset(true);
            } else {
                this.game.start();
            }
            this.close();
        }
        this.mainPage.appendChild(this.start_btn);

        this.setting_btn = document.createElement('div');
        this.setting_btn.id = 'settings',
            this.setting_btn.textContent = 'Settings';
        this.setting_btn.classList.add('btn');
        this.setting_btn.onclick = () => {
            this.goTo(2);
        }
        this.mainPage.appendChild(this.setting_btn);

        this.container.appendChild(this.mainPage);
    }
    createSettings() {
        this.container.appendChild(this.settings_container);
        this.settings_container.classList.add('hidden');
        this.settings_container.classList.add('settings', 'page');

        this.settings = {
            FPS: new Setting(this.game, this, 'FPS', 'checkbox', false),
        };

        for (let setting of Object.values(this.settings)) {
            this.settings_container.appendChild(setting.elem);
        }

        let back_btn = document.createElement('div');
        back_btn.classList.add('btn', 'back', 'small');
        back_btn.textContent = 'back';
        this.settings_container.appendChild(back_btn);
        back_btn.onclick = () => this.goTo(1);
    }
    goTo(pageNumber) {
        if (pageNumber > this.pages.length)
            return;
        for (let i = 0; i < this.pages.length; i++) {
            this.pages[i].classList.add('hidden');
        }
        this.pages[pageNumber - 1].classList.remove('hidden');
    }
    open(altText) {
        if (altText) {
            this.start_btn.textContent = altText;
            this.avoidReset = true;
        } else {
            this.start_btn.textContent = this.start_btn_text;
            this.avoidReset = false;
        }
        this.container.classList.remove('hidden');
    }
    close() {
        this.container.classList.add('hidden');
    }
}

class Setting {
    constructor(game, menu, name, valueType, initValue) {
        this.game = game;
        this.menu = menu;

        this.name = name;
        this.valueType = valueType;
        this.value = initValue;
        this.elem = this.create();
    }
    create() {
        let elem = document.createElement('input');
        elem.setAttribute('type', this.valueType);
        // visual init value
        switch (this.valueType) {
            case 'checkbox':
                elem.checked = this.value
                break;

            default:
                break;
        }
        elem.setAttribute('id', this.name);
        elem.onchange = this.changeState;

        let label = document.createElement('label');
        label.setAttribute('for', this.name);
        label.classList.add('setting', 'small')
        label.textContent = this.name;
        label.appendChild(elem);
        return label;
    }
    changeState(e) {
        let _this = game.menu.settings[Object.keys(game.menu.settings).filter(s => s == e.target.id.toUpperCase())[0]];
        switch (_this.valueType) {
            case 'checkbox':
                _this.value = !_this.value;
        }
    }
}