import {PublicApiBadgeAssertionWithBadgeClass} from "../app/public/models/public-api.model";
import {generateEmbedHtml} from "./generate-embed-html";

const sha256 = require('tiny-sha256');

function init(x) {
	console.info(x);
	function messageToSha256HexString(message) {
		return sha256(message);
	}

	function format_date(str) {
		const date = new Date(str);
		const day = date.getDate();
		const monthIndex = date.getMonth();
		const year = date.getFullYear();
		const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return monthNames[monthIndex] + ' ' + day + ", " + year;
	}

	const badges = document.getElementsByClassName("badgr-badge");

	for (let i = 0; i < badges.length; i++) {
		const badge = badges[i];

		const includeAwardDate = badge.getElementsByClassName("badgr-badge-date").length > 0;
		const includeBadgeName = badge.getElementsByClassName("badgr-badge-name").length > 0;
		const includeRecipientName = badge.getElementsByClassName("badgr-badge-recipient").length > 0;
		const includeVerifyButton = badge.getElementsByClassName("badgr-badge-verify").length > 0;

		const els = badge.getElementsByTagName("script");
		const staticPrefix = (els.length > 0)
			? els[0].getAttribute("src").replace(/[^/]+$/, '')
			: "https://badgr.io/";

		const as = badge.getElementsByTagName("a");
		if (as.length > 0) {
			const a = as[0];
			const badge_url = a.getAttribute("href");
			const expand_badge_url = badge_url + (badge_url.indexOf('?') === -1 ? '?' : '&') + 'expand=badge';

			const xhr = new XMLHttpRequest();
			xhr.open('GET', expand_badge_url, true);
			xhr.setRequestHeader('accept', 'application/json');
			xhr.onload = () => {
				if (xhr.status === 200) {
					const data = JSON.parse(xhr.responseText) as PublicApiBadgeAssertionWithBadgeClass;

					if (data.revoked) {
						badge.innerHTML = "This assertion has been revoked. " + (data.revocationReason || "");
						return;
					}

					const recipientName = ('extensions:recipientProfile' in data) ? data['extensions:recipientProfile']['name'] : undefined;

					let verified = false;
					if (data.recipient.type === "url") {
						const current_location = window.location.toString();
						if (data.recipient.hashed) {
							const parts = data.recipient.identity.split("$", 2);
							const expected = parts[1];
							const hash = messageToSha256HexString(current_location + data.recipient.salt);
							if (hash === expected) {
								verified = true;
							}
						} else {
							verified = (data.recipient.identity === current_location);
						}
					}

					const blockquote = generateEmbedHtml({
						shareUrl: badge_url,
						imageUrl: data.image,
						includeBadgeClassName: includeBadgeName,
						includeRecipientName: includeRecipientName && recipientName,
						includeAwardDate: includeAwardDate,
						includeVerifyButton: includeVerifyButton,
						badgeClassName: data.badge.name,
						recipientName: recipientName,
						awardDate: format_date(data.issuedOn),
						verified: verified,
						includeScript: false,
						staticPrefix: staticPrefix,
					});
					badge.innerHTML = blockquote.innerHTML;
					badge.setAttribute("style", 'border: none; font-family: Helvetica, Roboto, \"Segoe UI\", Calibri, sans-serif; border-radius: 4px; max-width: 500px; margin: 0; padding: 30px; position: unset; quotes: unset;');
				}
			};
			xhr.send();
		}
	}
}

init("DO THE INIT YO");