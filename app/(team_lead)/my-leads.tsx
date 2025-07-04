import MyLeadsPage from '../my-leads';
type Props = React.ComponentProps<typeof MyLeadsPage>;
export default function TeamLeadMyLeadsWrapper(props: Props) {
  return <MyLeadsPage {...props} routerBase="/(team_lead)" />;
} 