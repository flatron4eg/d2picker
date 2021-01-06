Array.prototype.shuffle = function () {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
};

const HeroAttribute = Object.freeze({
    STRENGTH: "str",
    AGILITY: "agi",
    INTELIGENCE: "int"
});

async function loadData () {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "https://www.dota2.com/jsfeed/heropediadata?feeds=itemdata,abilitydata,herodata",
            type: "GET",
            crossDomain: true,
            dataType: "jsonp",
            success: data => resolve(data)
        });
    });
}

/**
 * @typedef {Object} Item
 * @property {number} id
 * @property {string} key
 * @property {string} img
 * @property {string} dname - Display name
 * @property {"consumable" | "component" | "secret_shop" | "common" | "rare" | "epic" | "artifact"} qual
 * @property {number} cost
 * @property {string} desc
 * @property {string} notes
 * @property {string} attrib
 * @property {boolean} mc
 * @property {number} cd
 * @property {string} lore
 * @property {string[]} [components]
 * @property {boolean} created
 */

/**
 * @typedef {Object} Hero
 * @property {string} key
 * @property {string} dname - Display name
 * @property {string} u
 * @property {"str" | "agi" | "int"} pa
 * @property {Object} attribs
 * @property {string} dac
 * @property {string} droles
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Ability
 * @property {string} key
 * @property {string} dname - Display name
 * @property {string} affects
 * @property {string} desc
 * @property {string} notes
 * @property {string} dmg
 * @property {string} attrib
 * @property {string} cmb
 * @property {string} lore
 * @property {string} hurl
 */

/**
 * @typedef {Object} HeroBuild
 * @property {Hero} hero
 * @property {Item[]} items
 * @property {number[]} skills
 */

/**
 * @class
 * @constructor
 * @public
 */
class HeroPicker {
    /**
     * @param {Hero[]} heroes
     * @param {Item[]} items
     * @param {Ability[]} abilities
     */
    constructor (heroes, items, abilities) {
        /**
         * @type {Hero[]}
         * @private
         */
        this.heroes = heroes;
        /**
         * @type {Item[]}
         * @private
         */
        this.items = items;
        /**
         * @type {Ability[]}
         * @private
         */
        this.abilities = abilities;
        this.searchString = "";
        this.heroUltiesUnique = {
            keeper_of_the_light: "keeper_of_the_light_will_o_wisp",
            tiny: "tiny_grow"
        };
        this.ignoredSkills = [
            // doubled skills
            "troll_warlord_whirling_axes_melee",
            "morphling_adaptive_strike_str",
            "morphling_morph_str",
            "dark_willow_bedlam",
            "ember_spirit_activate_fire_remnant",
            "wisp_spirits_in",
            "wisp_spirits_out",
            "techies_focused_detonate",
            "treant_eyes_in_the_forest",
            "keeper_of_the_light_blinding_light",
            "keeper_of_the_light_spirit_form",
            "keeper_of_the_light_spirit_form_illuminate",
            "keeper_of_the_light_recall",
            "earth_spirit_stone_caller",
            "tiny_toss_tree",
            "treant_natures_guise",
            // aghanim scepter skills
            "clinkz_burning_army",
            "rattletrap_overclocking",
            "earth_spirit_petrify",
            "enchantress_bunny_hop",
            "grimstroke_dark_portrait",
            "kunkka_torrent_storm",
            "lycan_wolf_bite",
            "nyx_assassin_burrow",
            "ogre_magi_unrefined_fireblast",
            "snapfire_gobble_up",
            "spectre_haunt_single",
            "templar_assassin_trap_teleport",
            "shredder_chakram_2",
            "tiny_tree_channel",
            "treant_eyes_in_the_forest",
            "tusk_walrus_kick",
            "zuus_cloud",
            "meepo_petrify",
            "techies_minefield_sign",
            "leshrac_greater_lightning_storm",
            "antimage_mana_overload",
            // aghanim shard skills
            "alchemist_berserk_potion",
            "bristleback_hairball",
            "broodmother_silken_bola",
            "rattletrap_jetpack",
            "dark_seer_normal_punch",
            "dragon_knight_fireball",
            "faceless_void_time_walk_reverse",
            "grimstroke_ink_over",
            "jakiro_liquid_ice",
            "kunkka_tidal_wave",
            "lich_ice_spire",
            "life_stealer_open_wounds",
            "magnataur_horn_toss",
            "medusa_cold_blooded",
            "necrolyte_death_seeker",
            "ogre_magi_smash",
            "omniknight_hammer_of_purity",
            "pangolier_rollup",
            "phantom_assassin_fan_of_knives",
            "pudge_eject",
            "riki_poison_dart",
            "slark_fish_bait",
            "sniper_concussive_grenade",
            "storm_spirit_electric_rave",
            "terrorblade_demon_zeal",
            "shredder_flamethrower",
            "tinker_defense_matrix",
            "tiny_craggy_exterior",
            "tusk_frozen_sigil",
            "witch_doctor_voodoo_switcheroo",
            // ???
            "beastmaster_mark_of_the_beast",
            "zuus_heavenly_jump",
            // invoker spells
            "invoker_cold_snap",
            "invoker_ghost_walk",
            "invoker_tornado",
            "invoker_emp",
            "invoker_alacrity",
            "invoker_chaos_meteor",
            "invoker_sun_strike",
            "invoker_forge_spirit",
            "invoker_ice_wall",
            "invoker_deafening_blast",
            "invoker_invoke"
        ];
        this.fixedSkillImage = {
            riki_backstab: "riki_permanent_invisibility"
        };
    }

    /**
     * @param {string} heroname
     * @returns {string}
     */
    getHeroImage (heroname) {
        return `http://cdn.dota2.com/apps/dota2/images/heroes/${heroname}_full.png?v`;
    }

    /**
     * @param {string} itemkey
     * @returns {string}
     */
    getItemImage (itemkey) {
        const item = this.items.find(item => item.key === itemkey);
        return `http://cdn.dota2.com/apps/dota2/images/items/${item.img}`;
    }

    /**
     * @param {string} skillkey
     * @returns {string}
     */
    getSkillImage (skillkey) {
        if (this.isSkillTalent(skillkey)) {
            return `img/${skillkey}.png`;
        }
        const imageKey = this.fixedSkillImage[skillkey] || skillkey;
        return `http://cdn.dota2.com/apps/dota2/images/abilities/${imageKey}_hp1.png?v`;
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
            this.heroes
                .filter(hero => hero.dname.toLowerCase().includes(this.searchString))
                .forEach(hero => {
                    $(`.heroes .hero#${hero.key}`).addClass("found");
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
        this.heroes
            .filter(hero => hero.pa === HeroAttribute[attribute])
            .forEach(hero => {
                this.toggleHero(hero.key);
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
     * @param {string} heroname
     * @returns {void}
     */
    toggleHero (heroname) {
        const hero = this.heroes.find(hero => hero.key === heroname);
        hero.isActive = !hero.isActive;
        $(`.heroes .hero#${heroname}`).toggleClass("disabled");
    }

    /**
     * @param {string} heroname
     * @returns {Ability[]}
     */
    getHeroSkills (heroname) {
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
        const roles = this.heroes.map(hero => hero.droles.split(" - ")).flat();
        console.log(roles);
        return [...new Set(roles)];
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
            ...this.getAllRoles().map(role => $(`<div class="toggle role" id="${role}">${role}</div>`))
        ];
        const togglesHeader = $(`<span>Toggle</span>`);
        togglesContainer.append([togglesHeader, ...toggleButtons]);
        $("#container").append(togglesContainer);
        
        Object.keys(HeroAttribute).forEach(attrKey => {
            const heroesContainer = $(`<div id="${HeroAttribute[attrKey]}" class="heroes"></div>`).css({ width: `${100 / Object.keys(HeroAttribute).length}%` });
            const toggleButton = $(`<div class="toggle wide attr ${HeroAttribute[attrKey]}" id="${attrKey}">TOGGLE <span>${attrKey}</span></div>`);
            heroesContainer.append(toggleButton);
            this.heroes
                .filter(hero => hero.pa === HeroAttribute[attrKey])
                .forEach(hero => {
                    heroesContainer.append($(`<div class="hero image" id="${hero.key}" title="${hero.dname}"></div>`).data("image", this.getHeroImage(hero.key)));
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
    const data = await loadData(); 
    $("#container").html("");
    $("#container").append(`<button class="generate">GENERATE BUILD</button><div id="build"></div>`);
    picker = new HeroPicker(
        Object.keys(data.herodata)
            .map(key => ({
                ...data.herodata[key],
                key,
                isActive: true
            }))
            .sort((a, b) => a.dname.localeCompare(b.dname)),
        Object.keys(data.itemdata).map(key => ({
            ...data.itemdata[key],
            key
        })),
        Object.keys(data.abilitydata).map(key => ({
            ...data.abilitydata[key],
            key,
            hurl: data.abilitydata[key].hurl.toLowerCase()
        }))
    );
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