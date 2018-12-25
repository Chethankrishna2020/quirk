import React from "react";
import {
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import PropTypes from "prop-types";
import { getExercises, deleteExercise } from "./store";
import { Header, Row, Container, IconButton, Label } from "./ui";
import theme from "./theme";
import { CBT_FORM_SCREEN } from "./screens";
import { SavedThought, ThoughtGroup, groupThoughtsByDay } from "./thoughts";
import {
  NavigationScreenProp,
  NavigationState,
  NavigationAction,
} from "react-navigation";

const ThoughtItem = ({ thought, onPress, onDelete }) => (
  <Row alignItems={"strech"} marginBottom={18}>
    <TouchableOpacity
      style={{
        padding: 18,
        backgroundColor: theme.lightGray,
        borderRadius: 13,
        borderLeftWidth: 18,
        borderLeftColor: theme.blue,
        flex: 1,
        marginRight: 18,
      }}
      onPress={() => onPress(thought)}
    >
      <Text
        style={{
          color: theme.lightText,
          fontWeight: "700",
          fontSize: 16,
        }}
      >
        {thought.automaticThought}
      </Text>
    </TouchableOpacity>

    <IconButton
      alignSelf={"flex-start"}
      featherIconName={"trash"}
      onPress={() => onDelete(thought)}
    />
  </Row>
);

ThoughtItem.propTypes = {
  thought: PropTypes.object.isRequired,
  onPress: PropTypes.func.isRequired,
};

interface Props {
  navigation: NavigationScreenProp<NavigationState, NavigationAction>;
}

interface State {
  groups: ThoughtGroup[];
}

class CBTListScreen extends React.Component<Props, State> {
  static navigationOptions = {
    header: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      groups: [],
    };
  }

  syncExercises = (): void => {
    const fixTimestamps = (json): SavedThought => {
      const createdAt: Date = new Date(json.createdAt);
      const updatedAt: Date = new Date(json.updatedAt);
      return {
        createdAt,
        updatedAt,
        ...json,
      };
    };

    getExercises()
      .then(data => {
        const thoughts: SavedThought[] = data
          .map(([_, value]) => JSON.parse(value))
          .filter(n => n) // Worst case scenario, if bad data gets in we don't show it.
          .map(fixTimestamps);

        const groups: ThoughtGroup[] = groupThoughtsByDay(thoughts);

        this.setState({ groups });
      })
      .catch(console.error);
  };

  componentDidMount = () => {
    this.syncExercises();
  };

  navigateToForm = () => {
    this.navigateToFormWithThought(false);
  };

  navigateToFormWithThought = (thought: SavedThought | boolean) => {
    this.props.navigation.navigate(CBT_FORM_SCREEN, {
      thought,
    });
  };

  onItemDelete = (thought: SavedThought) => {
    deleteExercise(thought.uuid).then(() => this.syncExercises());
  };

  render() {
    const { groups } = this.state;
    const items = groups.map(group => {
      const thoughts = group.thoughts.map(thought => (
        <ThoughtItem
          key={thought.uuid}
          thought={thought}
          onPress={this.navigateToFormWithThought}
          onDelete={this.onItemDelete}
        />
      ));

      const isToday =
        new Date(group.date).toDateString() === new Date().toDateString();

      return (
        <View key={group.date}>
          <Label marginLeft={18}>{isToday ? "Today" : group.date}</Label>
          {thoughts}
        </View>
      );
    });

    return (
      <View
        style={{
          backgroundColor: theme.lightOffwhite,
          flex: 1,
        }}
      >
        <Container>
          <StatusBar barStyle="dark-content" />
          <ScrollView>
            <Row marginBottom={18}>
              <IconButton
                featherIconName={"edit"}
                onPress={() => this.navigateToForm()}
              />
              <Header>.quirk</Header>
            </Row>
            {items}
          </ScrollView>
        </Container>
      </View>
    );
  }
}

export default CBTListScreen;
