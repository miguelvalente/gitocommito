<p align="center">
  <a href="https://github.com/miguelvalente/gitocommmito"><img src="https://github.com/miguelvalente/gitocommito/blob/master/assets/banner.png?raw=true" alt="GitoCommito"></a>
</p>
<p align="center">
    <em>Let GitoCommito commit for you</em>
</p>

![GitoCommito](/assets/GitoCommito.gif?raw=true "GitoCommito")

## Features

- Automatic Commit Generation: Generate commits based on your staged changes.
- Compliance with Conventional Commits: Adhere to the Conventional Commits standards without memorizing the conventions.
- Integration with OpenAI: Leverages the power of OpenAI's language model to create meaningful commit messages.

## Getting Started

1.  Install the extension from the Visual Studio Code marketplace.
2.  Set your OpenAI key by calling **`GitoCommito: Set OpenAI Key`** in the VS Code command palette (**`Cmd/Ctrl + Shift + P`** to open the command palette).
3.  Start generating commit messages by calling **`GitoCommito: Generate Commit Message`** or by clicking on Gito's face in the Source Control view.
4.  There's two options for generating commits.
    - ⚡ GottaGoFast. Super fast but can only capture simple changes. Use if changed simple things across one file.
    - 🐢 GottaGoBest: Uses more tokens and is slower but generates better commits capable of tracking multiple changes.

## Requirements

- Visual Studio Code
- An OpenAI API Key

## Know Issues and Future Improvements

Check Mark Means Solved

- [ ] Gito does not deal well with moving files
- [ ] Gito does not deal with staged changes above a certain lenght
- [ ] GitEmoji accuracy is low

## Release Notes

- See CHANGELOG.md

### Version 0.0.14

- Initial Release
- Needs user testing. Feedback is highly appreciated. Please feel free to open an issue if you find any.

### Contributing

We welcome contributions to GitoCommito! If you'd like to contribute, feel free to fork the repository and submit a pull request.
