import MyLeadsPage from '../my-leads';
type Props = React.ComponentProps<typeof MyLeadsPage>;
export default function CallOperatorMyLeadsWrapper(props: Props) {
  return <MyLeadsPage {...props} routerBase="/(call_operator)" />;
} 