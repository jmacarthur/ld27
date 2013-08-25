#!/usr/bin/perl -w
use CGI;
use Data::Dumper;
use DBI;

use utils;
open STDERR, ">>errors" if $ENV{SERVER_SOFTWARE} =~ m/^mini_httpd/;


my $q = CGI->new;
my $data = $q->param('POSTDATA');
if(!defined($data)) { $data = $q->param('XForms:Model'); }
if(!defined($data)) { $data = $q->param('u'); }

my $userID = $data+0;
print $q->header('text/plain');
print "Stats about user $userID:\n";

my $dbh = DBI->connect("dbi:SQLite:../condition.sqlite","","");

my $sth = $dbh->prepare("select count(*) from sharduser inner join shard on sharduser.shardid=shard.shardid where sharduser.userid=? and shard.status=?;");
my $rh = $sth->execute($userID,3);
my @array = $sth->fetchrow_array();
my $deaths = $array[0];

$rh = $sth->execute($userID,2);
@array = $sth->fetchrow_array();
my $successes = $array[0];

print "WON: $successes\n";
print "LOST: $deaths\n";


