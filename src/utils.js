const core = require("@actions/core");

/**
 * Get PR description.
 *
 * @param {object} pullRequest Pull request payload
 * @returns string
 */
export function getInputs(pullRequest) {
  const assignIssues =
    core.getInput("assign-issues") === "false" ? false : true;
  const assignPullRequest =
    core.getInput("assign-pr") === "false" ? false : true;
  const failLabel =
    core.getInput("fail-label") === "false"
      ? false
      : core.getInput("fail-label") || "needs:feedback";
  const passLabel =
    core.getInput("pass-label") === "false"
      ? false
      : core.getInput("pass-label") || "needs:code-review";
  const commentTemplate =
    core.getInput("comment-template") === "false"
      ? false
      : core.getInput("comment-template") ||
        "{author} thanks for the PR! Could you please fill out the PR template with description, changelog, and credits information so that we can properly review and merge this?";
  const validateChangelog = 
    core.getInput("validate-changelog") === "false" ? false : true;
  const validateCredits = 
    core.getInput("validate-credits") === "false" ? false : true;
  const validateDescription = 
    core.getInput("validate-description") === "false" ? false : true;

  const authorLogin = pullRequest?.user?.login;
  const reviewers = core.getMultilineInput("reviewers");
  let prReviewers = reviewers[0] === "false" ? false : reviewers;
  if (prReviewers.length === 0) {
    // Check "reviewer" for backward compatibility.
    const prReviewer =
      core.getInput("reviewer") === "false" ? false : core.getInput("reviewer");
    if (prReviewer === false) {
      prReviewers = false;
    } else {
      prReviewers = prReviewer ? [prReviewer] : ["team:open-source-practice"];
    }
  }
  core.info("Remove PR author from PR reviewers.");
  if (prReviewers.length) {
    prReviewers = prReviewers.filter((reviewer) => reviewer !== authorLogin);
  }

  const addMilestone =
    core.getInput("add-milestone") === "false" ? false : true;

  // Add debug log of some information.
  core.debug(`Assign Issues: ${assignIssues} (${typeof assignIssues})`);
  core.debug(`Assign PR: ${assignPullRequest} (${typeof assignPullRequest})`);
  core.debug(`Fail Label: ${failLabel} (${typeof failLabel})`);
  core.debug(`Pass Label: ${passLabel} (${typeof passLabel})`);
  core.debug(
    `Comment Template: ${commentTemplate} (${typeof commentTemplate})`
  );
  core.debug(`PR reviewers: ${prReviewers} (${typeof prReviewers})`);
  core.debug(`Add Milestone: ${addMilestone} (${typeof addMilestone})`);

  return {
    assignIssues,
    addMilestone,
    assignPullRequest,
    commentTemplate,
    failLabel,
    passLabel,
    prReviewers,
    validateChangelog,
    validateCredits,
    validateDescription,
  };
}

/**
 * Get PR description.
 *
 * @param {object} payload Pull request payload
 * @returns string
 */
export function getDescription(payload) {
  let description = "";
  const cleanBody = payload?.body?.replace(/<!--.*?-->/gs, "");
  const matches = /#\s*Description of the Change.*\r?\n([^#]+)/.exec(cleanBody);
  if (matches !== null) {
    description = matches[1]
      .replace(/\r?\n|\r/g, "")
      .replace("Closes", "")
      .trim();
  }

  return description;
}

/**
 * Get Credits
 *
 * @param {object} payload Pull request payload
 * @returns array
 */
export function getCredits(payload) {
  const cleanBody = payload?.body?.replace(/<!--.*?-->/gs, "");
  let credits = [];
  const matches = /#\s*Credits.*\r?\n([^#]+)/.exec(cleanBody);
  if (matches !== null) {
    credits = matches[1].match(/@([\w-]+)/g);
    if (credits !== null) {
      return credits
        .map((item) => {
          return item.trim().replace("@", "");
        })
        .filter((username) => {
          return username.match(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i);
        });
    }
  }

  return [];
}

/**
 * Get Changelog
 *
 * @param {object} payload Pull request payload
 * @returns array
 */
export function getChangelog(payload) {
  let entries = [];
  const cleanBody = payload?.body?.replace(/<!--.*?-->/gs, "");
  const matches = /#\s*Changelog.*\r?\n([^#]+)/.exec(cleanBody);
  if (matches !== null) {
    const changelog = matches[1];
    entries = changelog.split(/\r?\n/);
  }

  return entries.filter((entry) => entry.length > 0);
}

/**
 * Compare two version strings.
 *
 * @param {string} a
 * @param {string} b
 */
export function versionCompare(a, b) {
  if (a.startsWith(b + "-")) return -1;
  if (b.startsWith(a + "-")) return 1;
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "case",
    caseFirst: "upper",
  });
}
