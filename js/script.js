/* eslint-disable no-unused-vars */
/* eslint-env jquery */
Array.prototype.shuffle = function () {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
};

const HeroAttribute = Object.freeze({
    STRENGTH: 0,
    AGILITY: 1,
    INTELIGENCE: 2
});

/**
 * @typedef {object} HeroShortData
 * @property {number} id
 * @property {string} name
 * @property {string} name_loc
 * @property {string} name_english_loc
 * @property {number} primary_attr
 * @property {number} complexity
 */

/**
 * @typedef {object} HeroValue 
 * @property {number[]} bonuses
 * @property {string} heading_loc
 * @property {boolean} is_percentage
 * @property {string} name
 * @property {number[]} values_float
 */

/**
 * @typedef {object} HeroAbility
 * @property {boolean} ability_has_scepter
 * @property {boolean} ability_has_shard
 * @property {boolean} ability_is_granted_by_scepter
 * @property {boolean} ability_is_granted_by_shard
 * @property {string} behavior
 * @property {number[]} cast_points
 * @property {number[]} cast_ranges
 * @property {number[]} channel_times
 * @property {number[]} cooldowns
 * @property {number} damage
 * @property {number[]} damages
 * @property {string} desc_loc
 * @property {number} dispellable
 * @property {number[]} durations
 * @property {number} flags
 * @property {number[]} gold_costs
 * @property {number} id
 * @property {number} immunity
 * @property {boolean} is_item
 * @property {number} item_cost
 * @property {number} item_initial_charges
 * @property {number} item_neutral_tier
 * @property {number} item_quality
 * @property {number} item_stock_max
 * @property {number} item_stock_time
 * @property {string} lore_loc
 * @property {number[]} mana_costs
 * @property {number} max_level
 * @property {string} name
 * @property {string} name_loc
 * @property {string[]} notes_loc
 * @property {string} scepter_loc
 * @property {string} shard_loc
 * @property {HeroValue[]} special_values
 * @property {number} target_team
 * @property {number} target_type
 * @property {number} type
 */

/**
 * @typedef {object} HeroData
 * @property {HeroAbility[]} abilities
 * @property {number} agi_base
 * @property {number} agi_gain
 * @property {number} armor
 * @property {number} attack_capability
 * @property {number} attack_range
 * @property {number} attack_rate
 * @property {string} bio_loc
 * @property {number} complexity
 * @property {number} damage_max
 * @property {number} damage_min
 * @property {number} health_regen
 * @property {string} hype_loc
 * @property {number} id
 * @property {number} int_base
 * @property {number} int_gain
 * @property {number} magic_resistance
 * @property {number} mana_regen
 * @property {number} max_health
 * @property {number} max_mana
 * @property {number} movement_speed
 * @property {string} name
 * @property {string} name_loc
 * @property {string} npe_desc_loc
 * @property {number} order_id
 * @property {number} primary_attr
 * @property {number} projectile_speed
 * @property {number[]} role_levels
 * @property {number} sight_range_day
 * @property {number} sight_range_noght
 * @property {number} str_base
 * @property {number} str_gain
 * @property {HeroAbility[]} talents
 * @property {number} turn_rate
 */

/**
 * @typedef {object} ItemShortData
 * @property {number} id
 * @property {string} name
 * @property {string} name_english_loc
 * @property {string} name_loc
 * @property {number} neutral_item_tier
 */

/**
 * @returns {Promise<HeroShortData[]>}
 */
async function loadHeroes () {
    return new Promise((resolve, _reject) => {
        $.ajax({
            url: "https://www.dota2.com/datafeed/herolist?language=english",
            type: "GET",
            crossDomain: true,
            dataType: "jsonp",
            success: data => resolve(data.result.data.heroes)
        });
    });
}

/**
 * @param {number} id
 * @returns {Promise<HeroData>} 
 */
async function loadHero (id) {
    return new Promise((resolve, _reject) => {
        $.ajax({
            url: `https://www.dota2.com/datafeed/herodata?language=english&hero_id=${id}`,
            type: "GET",
            crossDomain: true,
            dataType: "jsonp",
            success: data => resolve(data.result.data.heroes[0])
        });
    });
}

/**
 * @returns {Promise<ItemShortData[]>}
 */
 async function loadItems () {
    return new Promise((resolve, _reject) => {
        $.ajax({
            url: `https://www.dota2.com/datafeed/itemlist?language=english`,
            type: "GET",
            crossDomain: true,
            dataType: "jsonp",
            success: data => resolve(data.result.data.itemabilities)
        });
    });   
}

/**
 * @param {number} id
 * @returns {Promise<HeroAbility>}
 */
async function loadItem (id) {
    return new Promise((resolve, _reject) => {
        $.ajax({
            url: `https://www.dota2.com/datafeed/itemdata?language=english&item_id=${id}`,
            type: "GET",
            crossDomain: true,
            dataType: "jsonp",
            success: data => resolve(data.result.data.items[0])
        });
    });   
}

/**
 * @typedef {Object} HeroBuild
 * @property {HeroData} hero
 * @property {HeroAbility[]} items
 * @property {HeroAbility[]} skills
 */

/**
 * @class
 * @constructor
 * @public
 */
class HeroPicker {
    /**
     * @param {HeroShortData[]} heroes
     * @param {ItemShortData[]} items
     */
    constructor (heroes, items) {
        /**
         * @type {Map<number, HeroShortData>}
         * @private
         */
        this.heroes = new Map();
        heroes.forEach(hero => this.heroes.set(hero.id, hero));
        /**
         * @type {Map<number, ItemShortData>}
         * @private
         */
        this.items = new Map();
        items.forEach(item => this.items.set(item.id, item));
        this.searchString = "";
    }

    /**
     * @param {number} id
     * @returns {string}
     */
    getHeroImage (id) {
        const hero = this.heroes.get(id);
        const nameParts = hero.name.split("_");
        const heroName = nameParts[nameParts.length - 1];
        return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroName}.png`;
    }

    /**
     * @param {number} id
     * @returns {string}
     */
    getItemImage (id) {
        const item = this.items.get(id);
        const itemName = item.name.substring(item.name.indexOf("_") + 1);
        return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${itemName}.png`;
    }

    /**
     * @param {number} id
     * @returns {string}
     */
    getSkillImage (heroId, id) {
        if (this.isSkillTalent(skillkey)) {
            return `img/${skillkey}.png`;
        }
        const imageKey = this.fixedSkillImage[skillkey] || skillkey;
        return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/abilities/${abilityName}.png`;
    }

    /**
     * @param {string} itemkey
     * @returns {boolean}
     */
    isItemBoots (itemkey) {
        const item = this.items.find(item => item.key === itemkey);
        return item
            && item.components
            && (
                item.components.includes("boots")
                || item.components.some(component => this.isItemBoots(component))
            );
    }

    /**
     * @param {"add" | "remove" | "clear"} event
     * @param {string} data
     * @returns {void}
     */
    updateSearch (event, data) {
        const oldValue = this.searchString;
        switch (event) {
            case "remove":
                if (this.searchString.length) {
                    this.searchString = this.searchString.substring(0, this.searchString.length - 1);
                }
                break;
            case "clear":
                this.searchString = "";
                break;
            default:
                this.searchString = this.searchString + data.toString().toLowerCase();
        }
        if (oldValue === this.searchString) {
            return;
        }
        $("#search").html(this.searchString);
        $("#search").stop().fadeIn(0).fadeOut(2000);
        $(".heroes .hero.found").each(function () {
            $(this).removeClass("found");
        });
        if (this.searchString.length) {
            Array.from(this.heroes.values())
                .filter(hero => hero.name_english_loc.toLowerCase().includes(this.searchString))
                .forEach(hero => {
                    $(`.heroes .hero#${hero.id}`).addClass("found");
                });
            $(".search-overlay").show();
        } else {
            $(".search-overlay").hide();
        }
    }

    /**
     * @param {string} attribute
     * @returns {void}
     */
    toggleAttributeHeroes (attribute) {
        Array.from(this.heroes.values())
            .filter(hero => hero.primary_attr === HeroAttribute[attribute])
            .forEach(hero => {
                this.toggleHero(hero.id);
            });
    }

    /**
     * @param {string} role
     * @returns {void}
     */
    toggleRoleHeroes (role) {
        this.heroes
            .filter(hero => hero.droles.includes(role))
            .forEach(hero => {
                this.toggleHero(hero.key);
            });
    }

    /**
     * @returns {void}
     */
    toggleAllHeroes () {
        const isActive = this.heroes[0].isActive;
        this.heroes
            .forEach(hero => {
                if (hero.isActive === isActive) {
                    this.toggleHero(hero.key);
                }
            });
    }

    /**
     * @param {number} id
     * @returns {void}
     */
    toggleHero (id) {
        const hero = this.heroes.get(id);
        hero.isActive = !hero.isActive;
        $(`.heroes .hero#${id}`).toggleClass("disabled");
    }

    /**
     * @param {number} id
     * @returns {Ability[]}
     */
    getHeroSkills (id) {
        const skills = this.abilities.filter(ability => ability.key.startsWith(heroname) || ability.key.startsWith(heroname.replace("_","")));
        const talents = [
            { dname: "Talent Left", key: "talent_left", hurl: heroname },
            { dname: "Talent Right", key: "talent_right", hurl: heroname }
        ];
        return [ ...talents, ...skills ];
    }

    /**
     * @param {string} skillkey
     * @returns {boolean}
     */
    isSkillUlti (skillkey) {
        const skill = this.abilities.find(ability => ability.key === skillkey);
        if (!skill) {
            return false;
        }
        if (this.heroUltiesUnique[skill.hurl]) {
            return skillkey === this.heroUltiesUnique[skill.hurl];
        }
        const heroSkills = this.getHeroSkills(skill.hurl);
        const skillIndex = heroSkills.findIndex(ability => ability.key === skill.key);
        return skillIndex === (heroSkills.length - 1) && heroSkills.length > 5;
    }

    /**
     * @param {string} skillkey
     * @returns {boolean}
     */
    isSkillTalent (skillkey) {
        return skillkey.startsWith("talent");
    }

    /**
     * @param {string} skillkey
     * @param {number} level
     * @param {number} current
     * @returns {boolean}
     */
    canSkillBeLearned (skillkey, level, current) {
        if (this.ignoredSkills.includes(skillkey)) {
            return false;
        }
        /**
         * @type {number}
         */
        let maxLevel;
        /**
         * @type {number}
         */
        let levelForUp;
        if (this.isSkillUlti(skillkey)) {
            let levelsForUlti = [6,12,18];
            maxLevel = 3;
            if (skillkey.startsWith("meepo")) {
                levelsForUlti = [3,10,17];
            }
            levelForUp = levelsForUlti[current];
        } else if (this.isSkillTalent(skillkey)) {
            levelForUp = (current + 1) * 5 + 5;
            maxLevel = 4;
        } else {
            levelForUp = current * 2 + 1;
            maxLevel = 4;
            if (skillkey.startsWith("invoker")) {
                maxLevel = 7;
            } 
        }
        return !(level < levelForUp || current === maxLevel);
    }

    /**
     * @param {number} size
     * @returns {number}
     */
    getRandomNum (size) {
        return Math.floor(Math.random() * size);
    }

    /**
     * @returns {HeroBuild}
     */
    generateBuild () {
        const activeHeroes = this.heroes.filter(hero => hero.isActive);
        let randomNum = this.getRandomNum(activeHeroes.length);
        const hero = activeHeroes[randomNum];
        const allBootsItems = this.items.filter(item => this.isItemBoots(item.key));
        randomNum = this.getRandomNum(allBootsItems.length);
        const boots = allBootsItems[randomNum];
        /**
         * @type {Item[]}
         */
        const otherItems = this.items
            .filter(item => 
                !this.isItemBoots(item.key)
                && this.canItemBePurchased(item)
            )
            .shuffle()
            .slice(0, 5);
        const skills = this.generateSkillBuild(hero.key); 
        console.log(skills);
        return { hero, items: [ boots, ...otherItems ], skills };
    }

    /**
     * @param {Item} item
     * @returns {boolean}
     */
    canItemBePurchased (item) {
        return item.cost >= 2000
            && ["rare","epic","artifact"].includes(item.qual)
            && !this.items.some(someItem => someItem.components && someItem.components.includes(item.key));
    }

    /**
     * @param {string} heroname
     * @returns {number[]}
     */
    generateSkillBuild (heroname) {
        const skills = this.getHeroSkills(heroname);
        const currentLevels = {};
        const build = [];
        skills.forEach(skill => currentLevels[skill.key] = 0);
        for (let level = 1; level <= 25; level++) {
            const skillsCanBeLearned = skills.filter(skill => {
                let current = currentLevels[skill.key];
                if (this.isSkillTalent(skill.key)) {
                    current = currentLevels["talent_left"] + currentLevels["talent_right"];
                }
                return this.canSkillBeLearned(skill.key, level, current);
            });
            if (skillsCanBeLearned.length) {
                const skill = skillsCanBeLearned[this.getRandomNum(skillsCanBeLearned.length)];
                const skillIndex = skills.findIndex(ability => ability.key === skill.key);
                build.push(skillIndex);
                currentLevels[skill.key]++;
            } else {
                build.push(-1);
            }
        }
        return build;
    }

    /**
     * @returns {string[]}
     */
    getAllRoles () {
        return ["Основа","Поддержка","Быстрый урон","Контроль","Лес","Стойкость","Побег","Осада","Инициация"];
    }

    /**
     * @param {HeroBuild} build
     * @returns {void}
     */
    renderBuild (build) {
        const heroContainer = $(`<div class="hero image" title="${build.hero.dname}"></div>`).data("image", this.getHeroImage(build.hero.key));
        const itemsContainer = $(`<div class="items"></div>`);
        const skillBuildContainer = $(`<div class="skills"></div>`);
        build.items.forEach(item => {
            const itemContainer = $(`<div class="item image" title="${item.dname}"></div>`).data("image", this.getItemImage(item.key));
            itemsContainer.append(itemContainer);
        })
        const heroSkills = this.getHeroSkills(build.hero.key);
        build.skills.forEach((skillIndex, level) => {
            const skill = heroSkills[skillIndex];
            const levelContainer = $(`<div class="level"><span>${level + 1}</span></div>`);
            let skillContainer;
            if (skill) {
                skillContainer = $(`<div class="skill image" title="${skill.dname}"></div>`).data("image", this.getSkillImage(skill.key));
            } else {
                skillContainer = $(`<div class="skill"></div>`);
            }
            levelContainer.append(skillContainer);
            skillBuildContainer.append(levelContainer);
        });
        const buildContainer = $(`<div class="build"></div>`);
        $(buildContainer).append(`<button class="remove">REMOVE</button>`);
        $(buildContainer).append(heroContainer);
        $(buildContainer).append(itemsContainer);
        $(buildContainer).append(skillBuildContainer);
        $("#build").append(buildContainer);
    }

    /**
     * @returns {void}
     */
    renderHeroes () {
        const togglesContainer = $(`<div class="toggles"></div>`);
        const toggleButtons = [
            $(`<div class="toggle" id="all">ALL</div>`),
            ...this.getAllRoles().map((role, index) => $(`<div class="toggle role" id="${index}">${role}</div>`))
        ];
        const togglesHeader = $(`<span>Toggle</span>`);
        togglesContainer.append([togglesHeader, ...toggleButtons]);
        $("#container").append(togglesContainer);
        
        Object.keys(HeroAttribute).forEach(attrKey => {
            const heroesContainer = $(`<div id="${HeroAttribute[attrKey]}" class="heroes"></div>`).css({ width: `${100 / Object.keys(HeroAttribute).length}%` });
            const toggleButton = $(`<div class="toggle wide attr ${HeroAttribute[attrKey]}" id="${attrKey}">TOGGLE <span>${attrKey}</span></div>`);
            heroesContainer.append(toggleButton);
            Array.from(this.heroes.values())
                .filter(hero => hero.primary_attr === HeroAttribute[attrKey])
                .forEach(hero => {
                    heroesContainer.append($(`<div class="hero image" id="${hero.id}" title="${hero.name_english_loc}"></div>`).data("image", this.getHeroImage(hero.id)));
                });
            $("#container").append(heroesContainer);
        });
    }
}

/**
 * @type {HeroPicker}
 */
let picker = null;

$(document).ready(async () => {
    const [heroes, items] = await Promise.all([
        loadHeroes(),
        loadItems()
    ]);
    $("#container").html("");
    $("#container").append(`<button class="generate">GENERATE BUILD</button><div id="build"></div>`);
    picker = new HeroPicker(heroes, items);
    picker.renderHeroes();
});

$(document)
    .on("click", ".heroes .hero", function () {
        const heroname = $(this).attr("id");
        picker.toggleHero(heroname);
    })
    .on("click", ".toggle", function () {
        const value = $(this).attr("id");
        if ($(this).hasClass("attr")) {
            picker.toggleAttributeHeroes(value);
        } else if ($(this).hasClass("role")) {
            picker.toggleRoleHeroes(value);
        } else if (value === "all") {
            picker.toggleAllHeroes();
        }
    })
    .on("click", ".generate", function () {
        const build = picker.generateBuild();
        picker.renderBuild(build);
    })
    .on("click", ".remove", function () {
        $(this).parent().remove();
    })
    .on("keydown", "body", function (e) {
        const key = e.which;
        if (key === 8) {
            picker.updateSearch("remove");
        } else if ((key >= 65 && key <= 90) || key === 32) {
            e.preventDefault();
            picker.updateSearch("add", String.fromCharCode(e.which));
        }
    }).on("mousedown", "body", function (e) {
        picker.updateSearch("clear");
    });

$("body").on("DOMNodeInserted", ":has(.image)", function (e) {
    $(this).find(".image").each(function () {
        const imageSrc = $(this).data("image");
        if (imageSrc && !$(this).hasClass("loading")) {
            $(this).addClass("loading");
            $(`<img src="${imageSrc}">`).on("load", () => {
                $(this).animate({ opacity: 0 }, 200, function () {
                    $(this).css({ backgroundImage: `url(${imageSrc})` });
                    $(this).animate({ opacity: 1 }, 200);
                });
                $(this).removeClass("loading");
                $(this).removeData("image");
            });
        }
    });
});