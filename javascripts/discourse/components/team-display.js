import { inject as service } from "@ember/service";
import Component from "@glimmer/component";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { tracked } from "@glimmer/tracking";
import { userPath } from "discourse/lib/url";
import { action } from "@ember/object";
import User from "discourse/models/user";
import { computed } from "@ember/object";

export default class TeamDisplayComponent extends Component {
  @service teamDisplay;
  @tracked members;
  @tracked loading = false;

  constructor() {
    super(...arguments);

    this.loadData();
  }

  @action
  loadData() {
    this.loading = true;
    this.getMembers();
  }

  async getMembers() {
    if (!this.loading && !this.members) {
      return;
    }
     ajax(`/groups/${settings.team_timezones_group.split("|")[0]}/members.json`).then(async (result) => {

      let getRow = (member) => {
        let timeScore = (a, i) => {
          const periodic_time = a + i;
          const local_time =
            periodic_time >= 0
              ? periodic_time <= 23
                ? periodic_time
                : periodic_time - 24
              : periodic_time + 24;
          return settings.team_timezones_mode == "zones"
            ? local_time >=
              settings.team_timezones_evening_start
              ? 0.5
              : local_time <
                settings.team_timezones_morning_start
                ? 0
                : 1
            : Math.abs(
              Math.pow(
                Math.sin(
                  (Math.PI / 24) *
                  (local_time -
                    settings
                      .team_timezones_availability_origin_offset)
                ),
                settings
                  .team_timezones_availability_curve_power_function
              )
            );
        };

        const currentDate = new Date();
        const currentHour = currentDate.getUTCHours();

        let rgbToHex = (r, g, b) => {
          return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };

        let hexToRgb = (hex) => {
          var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result
            ? [
              parseInt(result[1], 16),
              parseInt(result[2], 16),
              parseInt(result[3], 16),
            ]
            : null;
        };

        let colourGradientor = (p, rgb_beginning, rgb_end) => {
          var w = p * 2 - 1;
          var w1 = (w + 1) / 2.0;
          var w2 = 1 - w1;
          var rgb = [
            parseInt(rgb_beginning[0] * w1 + rgb_end[0] * w2),
            parseInt(rgb_beginning[1] * w1 + rgb_end[1] * w2),
            parseInt(rgb_beginning[2] * w1 + rgb_end[2] * w2),
          ];
          return rgbToHex(rgb[0], rgb[1], rgb[2]);
        };

        let row = [];

        let backgroundColour = getComputedStyle(document.body).getPropertyValue('--secondary');

        for (let index = 0; index < 24; index++) {
          row.push(
            {
              class: `${index == 11 ? "highlight" : "lowlight"}`,
              style: `background-color:${colourGradientor(
                timeScore(member.offset, (index + currentHour + 37) % 24),
                hexToRgb(
                  settings
                    .team_timezones_available_colour
                ),
                hexToRgb(
                  backgroundColour
                )
              )};`,
            })
        }

        return row;
      }

      const membersPromises = result.members.map(async (member) => {
        let user;
        let timezone = member.timezone;
        member.offset = Math.round(moment.tz(timezone)._offset / 60);
        member.displayName = member.name || member.username;
        user = await User.findByUsername(member.username);
        member.user = user;
        member.path = userPath(member.username);
        member.row = getRow(member);
      });

      await Promise.all(membersPromises);

      this.members = result.members;

      let currentHour = this.currentHour();

      let timesScore = (offset, currentHour) => {
        return Math.pow(Math.sin((Math.PI / 24) * (offset + currentHour)), 4);
      };

      this.members.sort((a, b) => {
        let nameA = a.displayName.toLowerCase();
        let nameB = b.displayName.toLowerCase();
        let nameComparison = 0;

        if(nameA < nameB) {nameComparison = -1;}
        if(nameB > nameB) {nameComparison = 1;}

        let timeScoreA = timesScore(a.offset, currentHour) ;
        let timeScoreB = timesScore(b.offset, currentHour);
        let timeScoreComparison = 0;

        if (timeScoreA < timeScoreB) {timeScoreComparison = 1;}
        if (timeScoreA > timeScoreB) {timeScoreComparison = -1;}

        return timeScoreComparison || nameComparison;
     });

     })
     .catch(popupAjaxError)
     .finally(() => {
        this.loading = false;
      })
    }


  currentHour() {
    const date = new Date();
    return date.getHours();
  }

  get hours() {
    let hours = [];
    const currentHour = this.currentHour();
    let hour;

    for (let index = 0; index < 24; index++) {
      hour = (index + currentHour + 37) % 24
      hours.push(
        {
          hour: hour < 10 ? `0${hour}` : `${hour}`,
          class: hour === currentHour ? "highlight" : "lowlight",
        }
      )
    }

    return hours;
  }

  get title() {
    return `Timezones for group: ${settings.team_timezones_group.split("|")[0]}`
  }

  @computed("teamDisplay.shouldDisplay")
  get shouldDisplay() {
    return this.teamDisplay.shouldDisplay;
  }
}
