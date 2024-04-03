import Service from "@ember/service";
import { inject as service } from "@ember/service";
import { computed } from "@ember/object";

export default class TeamDisplayService extends Service {
  @service router;

  @computed("router.currentRouteName", "router.currentRoute.attributes.category.id", "router.currentRoute.attributes.tag.id")
  get viewingCategoryId() {
    if (!this.router.currentRouteName.match(/^discovery\./)) return;
    return this.router.currentRoute.attributes?.category?.id;
  };

  @computed("router.currentRouteName", "router.currentRoute.attributes.category.id", "router.currentRoute.attributes.tag.id")
  get viewingTagId() {
    if (!this.router.currentRouteName.match(/^tag?\.show/)) return;
    return this.router.currentRoute.attributes?.tag?.id;
  };

  @computed("router.currentRouteName", "router.currentRoute.attributes.category.id", "router.currentRoute.attributes.tag.id")
  get shouldDisplay() {

    let teamTimezoneCategories = [];
    let teamTimezoneTags = [];
  
    if (settings.team_timezones_categories !== "") {
      teamTimezoneCategories = settings.team_timezones_categories
        .split("|")
        .map((id) => parseInt(id, 10));
    }

    if (settings.team_timezones_tags !== "") {
      teamTimezoneTags = settings.team_timezones_tags.split("|");
    }

    if (teamTimezoneCategories.includes(this.viewingCategoryId)) {
      return true;
    } else if (teamTimezoneTags.includes(this.viewingTagId)) {
      return true;
    } else if (teamTimezoneCategories.length === 0 && teamTimezoneTags.length === 0) {
      return true;
    } else {
      return false;
    }
  }
};
