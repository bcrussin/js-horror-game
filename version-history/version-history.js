const versionsContainer = document.getElementById("versions-container");

window.addEventListener("load", () => {
	loadChangelog('../');
});

function loadChangelog(path, onlyCurrent) {
	return new Promise((resolve) => {
		fetch((path ?? '') + "version-history.json")
			.then((res) => res.json())
			.then((data) => {
                let changelog = parseChangelog(data, onlyCurrent);
				resolve(changelog);
			});
	});
}

function parseChangelog(data, onlyCurrent) {
	let containerElement = !!versionsContainer ? versionsContainer : document.createElement("div");
	containerElement.innerHTML = "";

	let versions;
	if (!!onlyCurrent) {
		versions = {};
		versions[data.current] = data.versions[data.current];
	} else {
		versions = data.versions;
	}

    if (!onlyCurrent) {
        let hr = document.createElement('hr');
        containerElement.appendChild(hr);
    }

	Object.entries(versions).forEach(([key, version]) => {
		let container = document.createElement("div");
		container.classList.add("version");

		let title = document.createElement("h4");
		let titleText = `v${key} - ${version.title}`;
		if (!onlyCurrent && key == data.current) titleText += " (Current)";
		title.innerHTML = titleText;

		let description = document.createElement("p");
		description.innerHTML = version.description ?? '';

        let changesLabel = document.createElement('p');
        changesLabel.innerHTML = "Changes:";
        changesLabel.style.marginBottom = '0';

		let changesList = document.createElement("ul");
        let hasChanges = !!version.changes && version.changes.length > 0;

		if (hasChanges) {
			for (changeText of version.changes) {
				let change = document.createElement("li");
				change.innerHTML = changeText;

				changesList.appendChild(change);
			}
		}


		container.appendChild(title);
		container.append(description);
		
        if (hasChanges) {
            container.appendChild(changesLabel);
            container.appendChild(changesList);
        }
        
        if (!onlyCurrent) {
            let hr = document.createElement('hr');
            container.appendChild(hr);
        }

		containerElement.appendChild(container);
	});

    return containerElement.innerHTML;
}
